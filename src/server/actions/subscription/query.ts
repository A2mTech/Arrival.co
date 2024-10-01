"use server";

import { pricingPlans } from "@/config/pricing";
import { siteUrls } from "@/config/urls";
import { env } from "@/env";
import { getAbsoluteUrl } from "@/lib/utils";
import { protectedProcedure } from "@/server/procedures";
import Stripe from 'stripe';
import { redirect } from "next/navigation";
import { eachMonthOfInterval, format, startOfMonth, subMonths } from "date-fns";
import {createClient} from "@/utils/supabase/server";
import {getAuthenticatedUser} from "@lemonsqueezy/lemonsqueezy.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export async function getCheckoutURL(priceId?: string) {
    const supabase = createClient();

    await protectedProcedure();

    const { data: { user } } = await supabase.auth.getUser()
    const { currentOrg } = await getOrganizations();

    if (!user || !currentOrg) {
        return redirect(siteUrls.auth.login);
    }

    if (!priceId) {
        return redirect(siteUrls.dashboard.home);
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        success_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        cancel_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        customer_email: currentOrg.email ?? undefined,
        client_reference_id: currentOrg.id,
        metadata: {
            user_id: user.id,
            org_id: currentOrg.id,
        },
    });

    return session.url;
}

export async function getOrgSubscription() {
    const supabase = createClient();

    try {
        await protectedProcedure();

        const { user } = await getAuthenticatedUser();

        if (!currentOrg) {
            throw new Error("No current organization found");
        }

        // Rechercher le client Stripe pour cette organisation
        const { data: stripeCustomer, error: customerError } = await supabase
            .from('stripe_customers')
            .select('stripe_customer_id')
            .eq('user_id', currentOrg.id)
            .single();

        let stripeCustomerId: string;

        if (customerError || !stripeCustomer) {
            // Créer un nouveau client Stripe si nécessaire
            const customer = await stripe.customers.create({
                email: currentOrg.email,
                metadata: {
                    org_id: currentOrg.id
                }
            });
            stripeCustomerId = customer.id;

            // Insérer le nouveau client Stripe dans la base de données
            await supabase
                .from('stripe_customers')
                .insert({
                    user_id: currentOrg.id,
                    stripe_customer_id: stripeCustomerId,
                    email: customer.email
                });
        } else {
            stripeCustomerId = stripeCustomer.stripe_customer_id;
        }

        const { data: orgSubscription, error: subError } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('org_id', currentOrg.id)
            .single();

        if (subError || !orgSubscription) {
            // Aucun abonnement trouvé, mais nous avons maintenant un client Stripe
            return null;
        }

        const stripeSubscription = await stripe.subscriptions.retrieve(orgSubscription.stripe_id);

        const customerPortalSession = await stripe.billingPortal.sessions.create({
            customer: stripeCustomerId,
            return_url: getAbsoluteUrl(siteUrls.organization.plansAndBilling),
        });

        const plan = pricingPlans.find(
            (p) => p.stripeId?.monthly === stripeSubscription.items.data[0]?.price.id ||
                p.stripeId?.yearly === stripeSubscription?.items?.data[0]?.price.id
        );

        return {
            id: orgSubscription.id,
            stripeId: stripeSubscription.id,
            status: stripeSubscription.status,
            current_period_start: stripeSubscription.current_period_start,
            current_period_end: stripeSubscription.current_period_end,
            cancel_at: stripeSubscription.cancel_at,
            canceled_at: stripeSubscription.canceled_at,
            customerPortalUrl: customerPortalSession.url,
            plan: plan ? {
                title: plan.title,
                stripeId: plan.stripeId
            } : undefined,
        };
    } catch (error) {
        console.error("Error fetching org subscription:", error);
        return null;
    }
}
type SubscriptionCountByMonth = {
    status?: Stripe.Subscription.Status;
};

export async function getSubscriptionsCount({
                                                status,
                                            }: SubscriptionCountByMonth) {
    await protectedProcedure();

    const dateBeforeMonths = subMonths(new Date(), 6);
    const startDateOfTheMonth = startOfMonth(dateBeforeMonths);

    const subscriptions = await stripe.subscriptions.list({
        status,
        created: { gte: Math.floor(startDateOfTheMonth.getTime() / 1000) },
        expand: ['data.customer'],
    });

    const months = eachMonthOfInterval({
        start: startDateOfTheMonth,
        end: new Date(),
    });

    const subscriptionsCountByMonth = months.map((month) => {
        const monthStr = format(month, "MMM-yyy");
        const count = subscriptions.data.filter(
            (subscription) =>
                format(new Date(subscription.created * 1000), "MMM-yyy") === monthStr
        ).length;
        return { Date: monthStr, SubsCount: count };
    });

    return {
        totalCount: subscriptions.data.length,
        subscriptionsCountByMonth,
    };
}

export async function getRevenueCount() {
    await protectedProcedure();

    const dateBeforeMonths = subMonths(new Date(), 6);
    const startDateOfTheMonth = startOfMonth(dateBeforeMonths);

    const invoices = await stripe.invoices.list({
        created: { gte: Math.floor(startDateOfTheMonth.getTime() / 1000) },
        status: 'paid',
    });

    const totalRevenue = invoices.data.reduce(
        (acc, invoice) => acc + invoice.amount_paid,
        0
    );

    const months = eachMonthOfInterval({
        start: startDateOfTheMonth,
        end: new Date(),
    });

    const revenueCountByMonth = months.map((month) => {
        const monthStr = format(month, "MMM-yyy");
        const revenueCount = invoices.data
            .filter(
                (invoice) =>
                    format(new Date(invoice.created * 1000), "MMM-yyy") === monthStr
            )
            .reduce((acc, invoice) => acc + invoice.amount_paid, 0);

        const count = revenueCount / 100; // Convert cents to dollars
        return { Date: monthStr, RevenueCount: count };
    });

    return {
        totalRevenue: totalRevenue / 100, // Convert cents to dollars
        revenueCountByMonth,
    };
}