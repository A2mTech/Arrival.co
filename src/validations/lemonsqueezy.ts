import Stripe from "stripe";

/**
 * Check if the value is an object.
 */
function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

/**
 * Typeguard to check if the object is a valid Stripe event.
 */
export function isStripeEvent(obj: unknown): obj is Stripe.Event {
    if (
        isObject(obj) &&
        typeof obj.id === "string" &&
        typeof obj.type === "string" &&
        isObject(obj.data) &&
        isObject(obj.data.object)
    ) {
        return true;
    }
    return false;
}

/**
 * Typeguard to check if the Stripe event is a subscription-related event.
 */
export function isSubscriptionEvent(event: Stripe.Event): event is Stripe.Event & {
    data: {
        object: Stripe.Subscription;
    };
} {
    return event.type.startsWith('customer.subscription.');
}

/**
 * Typeguard to check if the Stripe event has customer metadata.
 */
export function hasCustomerMetadata(event: Stripe.Event): event is Stripe.Event & {
    data: {
        object: Stripe.Subscription & {
            customer: string;
        };
    };
} {
    if (isSubscriptionEvent(event) && typeof event.data.object.customer === 'string') {
        return true;
    }
    return false;
}