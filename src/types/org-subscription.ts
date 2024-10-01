import Stripe from "stripe";

export type OrgSubscription = {
    id: string;
    stripeId: string;
    status: Stripe.Subscription.Status;
    current_period_start: number;
    current_period_end: number;
    cancel_at: number | null;
    canceled_at: number | null;
    customerPortalUrl: string;
    plan?: {
        title: string;
        stripeId?: {
            monthly?: string;
            yearly?: string;
        };
    };
} | null;