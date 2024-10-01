"use server";

import Stripe from 'stripe';
import { revalidatePath } from "next/cache";
import { env } from "@/env";
import { getOrgSubscription } from "@/server/actions/subscription/query";
import {Database, Json} from "@/types/database.types";
import { createClient } from "@/utils/supabase/server";
import {protectedProcedure} from "@/server/procedures";
import {getAbsoluteUrl} from "@/lib/utils";
import {siteUrls} from "@/config/urls";


const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

type NewWebhookEvent = Database['public']['Tables']['webhook_events']['Insert'];
type NewSubscription = Database['public']['Tables']['subscriptions']['Insert'];
type NewInvoice = Database['public']['Tables']['stripe_invoices']['Insert'];


export async function createCustomerPortalSession(stripeSubscriptionId: string): Promise<string | null> {
    const supabase = createClient();

    try {
        await protectedProcedure();

        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

        const session = await stripe.billingPortal.sessions.create({
            customer: subscription.customer as string,
            return_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        });

        return session.url;
    } catch (error) {
        console.error("Error creating customer portal session:", error);
        return null;
    }
}


export async function storeWebhookEvent(
    eventName: string,
    body: Json,
    stripeEventId: string
) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('webhook_events')
        .insert({
            event_name: eventName,
            processed: false,
            body,
            stripe_event_id: stripeEventId
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

interface StripeEvent {
    id: string;
    object: string;
    api_version: string;
    created: number;
    data: {
        object: Stripe.Subscription | Stripe.Invoice | Stripe.Customer;
    };
    livemode: boolean;
    pending_webhooks: number;
    request: {
        id: string | null;
        idempotency_key: string | null;
    };
    type: string;
}

function isStripeEvent(event: unknown): event is StripeEvent {
    return (
        typeof event === 'object' &&
        event !== null &&
        'type' in event &&
        typeof (event as StripeEvent).type === 'string' &&
        'data' in event &&
        typeof (event as StripeEvent).data === 'object' &&
        (event as StripeEvent).data !== null &&
        'object' in (event as StripeEvent).data
    );
}
export async function processWebhookEvent(webhookEvent: NewWebhookEvent) {
    const supabase = createClient();

    const { data: dbWebhookEvent, error } = await supabase
        .from('webhook_events')
        .select()
        .eq('id', webhookEvent.id!)
        .single();

    if (error || !dbWebhookEvent) {
        console.error(`Webhook event #${webhookEvent.id} not found in the database.`);
        throw new Error(`Webhook event #${webhookEvent.id} not found in the database.`);
    }

    let processingError = "";
    const eventBody = webhookEvent.body;

    if (isStripeEvent(eventBody)) {
        try {
            switch (eventBody.type) {
                case "customer.subscription.created":
                case "customer.subscription.updated":
                case "customer.subscription.deleted":
                    await handleSubscriptionEvent(eventBody.data.object as Stripe.Subscription);
                    break;
                case "invoice.payment_succeeded":
                    await handleInvoicePaymentSucceeded(eventBody.data.object as Stripe.Invoice);
                    break;
                case "customer.updated":
                    await handleCustomerUpdated(eventBody.data.object as Stripe.Customer);
                    break;
                default:
                    console.log(`Unhandled event type: ${eventBody.type}`);
            }
        } catch (error) {
            console.error("Error processing event:", error);
            processingError = `Error processing event: ${(error as Error).message}`;
        }
    } else {
        console.error("Event body is invalid:", JSON.stringify(eventBody));
        processingError = "Event body is invalid or missing required fields.";
    }

    const { error: updateError } = await supabase
        .from('webhook_events')
        .update({
            processed: true,
            processing_error: processingError,
        })
        .eq('id', webhookEvent.id!);

    if (updateError) {
        console.error("Failed to update webhook event:", updateError);
        throw updateError;
    }
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
    const supabase = createClient();

    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    const orgId = await getOrCreateStripeCustomer(customerId);

    if (!orgId) {
        console.error("Unable to process subscription: org_id not found for customer", customerId);
        return;
    }

    const updateData: NewSubscription = {
        stripe_id: subscription.id,
        org_id: orgId,
        status: subscription.status,
        price_id: subscription.items.data[0]?.price?.id ?? '',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end
    };

    const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(updateData, { onConflict: 'stripe_id' });

    if (upsertError) {
        console.error("Failed to upsert subscription:", upsertError);
    } else {
        console.log("Successfully upserted subscription:", subscription.id);
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const supabase = createClient();

    console.log("Processing invoice payment succeeded:", invoice.id);

    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!customerId) {
        console.error("Invoice has no associated customer:", invoice.id);
        return;
    }

    const orgId = await getOrCreateStripeCustomer(customerId);
    if (!orgId) {
        console.error("Unable to process invoice: org_id not found for customer", customerId);
        return;
    }

    const invoiceData: NewInvoice = {
        stripe_id: invoice.id,
        amount_paid: invoice.amount_paid,
        status: invoice.status as string,
        subscription_id: invoice.subscription as string,
        created_at: new Date(invoice.created * 1000).toISOString()
    };

    const { error: insertError } = await supabase
        .from('stripe_invoices')
        .insert(invoiceData);

    if (insertError) {
        console.error("Failed to insert invoice:", insertError);
    } else {
        console.log("Successfully inserted invoice:", invoice.id);
    }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
    const orgId = await getOrCreateStripeCustomer(customer.id);
    console.log("Customer updated:", customer.id, "org_id:", orgId);
}

async function getOrCreateStripeCustomer(customerId: string): Promise<string | null> {
    const supabase = createClient();

    let { data: stripeCustomer, error: customerError } = await supabase
        .from('stripe_customers')
        .select('org_id')
        .eq('stripe_id', customerId)
        .single();

    if (!customerError && stripeCustomer) {
        return stripeCustomer.org_id;
    }

    const stripeCustomerData = await stripe.customers.retrieve(customerId);

    if (stripeCustomerData.deleted) {
        console.error("Customer has been deleted in Stripe:", customerId);
        return null;
    }

    let org_id = stripeCustomerData.metadata?.org_id;

    if (!org_id) {
        console.log("No org_id found in customer metadata, looking for organization...");
        console.log("stripeCustomerData:", stripeCustomerData.email);
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id')
            .eq('email', stripeCustomerData.email as string)
            .single();

        if (orgError || !org) {
            console.log("Orga eror:", orgError);
            console.log("Orga:", org);
            console.error("Unable to find organization for customer:", customerId);
            return null;
        }

        org_id = org.id;

        await stripe.customers.update(customerId, {
            metadata: { org_id: org_id }
        });

        console.log("Updated Stripe customer metadata with org_id:", org_id);
    }

    const { error: insertError } = await supabase
        .from('stripe_customers')
        .insert({
            stripe_id: customerId,
            org_id: org_id,
            email: stripeCustomerData.email
        })
        .single();

    if (insertError) {
        if (insertError.code === '23505') { // unique constraint violation
            console.log("Customer already exists in stripe_customers table:", customerId);
        } else {
            console.error("Failed to insert customer into stripe_customers:", insertError);
            return null;
        }
    } else {
        console.log("Customer successfully added to stripe_customers table:", customerId);
    }

    return org_id;
}

export async function changePlan(currentPriceId: string, newPriceId: string) {
    const supabase = createClient();

    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error(`Subscription not found for price id #${currentPriceId}.`);
    }

    // Récupérer la subscription Stripe complète
    const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeId);

    if (!stripeSubscription.items.data[0]) {
        throw new Error(`Subscription item not found for price id #${currentPriceId}.`);
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeId, {
        items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
        }],
        proration_behavior: 'always_invoice',
    });

    // Save in db
    try {
        await supabase
            .from('subscriptions')
            .update({
                stripe_id: updatedSubscription.id,
                price_id: newPriceId,
                status: updatedSubscription.status,
                current_period_start: new Date(updatedSubscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(updatedSubscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: updatedSubscription.cancel_at_period_end
            })
            .eq('stripe_id', subscription.stripeId);
    } catch (error) {
        throw new Error(`Failed to update Subscription #${subscription.stripeId} in the database.`);
    }

    revalidatePath("/");

    return updatedSubscription;
}

export async function cancelPlan() {
    const supabase = createClient();

    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    const canceledSubscription = await stripe.subscriptions.cancel(subscription.stripeId);

    // Save in db
    try {
        await supabase
            .from('subscriptions')
            .update({
                status: canceledSubscription.status,
                cancel_at_period_end: canceledSubscription.cancel_at_period_end
            })
            .eq('stripe_id', subscription.stripeId);
    } catch (error) {
        throw new Error(`Failed to update Subscription #${subscription.stripeId} in the database.`);
    }

    revalidatePath("/");

    return canceledSubscription;
}

export async function pausePlan() {
    const supabase = createClient();

    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    // Stripe doesn't have a native "pause" feature, so we'll cancel at period end
    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeId, {
        cancel_at_period_end: true,
    });

    // Update the db
    try {
        await supabase
            .from('subscriptions')
            .update({
                status: 'paused',
                cancel_at_period_end: true
            })
            .eq('stripe_id', subscription.stripeId);
    } catch (error) {
        throw new Error(`Failed to pause Subscription #${subscription.stripeId} in the database.`);
    }

    revalidatePath("/");

    return updatedSubscription;
}

export async function resumePlan() {
    const supabase = createClient();

    const subscription = await getOrgSubscription();

    if (!subscription) {
        throw new Error("No subscription found.");
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.stripeId, {
        cancel_at_period_end: false,
    });

    // Update the db
    try {
        await supabase
            .from('subscriptions')
            .update({
                status: updatedSubscription.status,
                cancel_at_period_end: false
            })
            .eq('stripe_id', subscription.stripeId);
    } catch (error) {
        throw new Error(`Failed to resume Subscription #${subscription.stripeId} in the database.`);
    }

    revalidatePath("/");

    return updatedSubscription;
}