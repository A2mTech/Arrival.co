import { env } from "@/env";
import {isStripeEvent} from "@/validations/lemonsqueezy";
import {
    processWebhookEvent,
    storeWebhookEvent,
} from "@/server/actions/subscription/mutations";
import Stripe from "stripe";
import {Json} from "@/types/database.types";
import {logger} from "posthog-js/lib/src/utils/logger";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
});

export async function POST(request: Request) {
        const rawBody = await request.text();
        const secret = env.STRIPE_WEBHOOK_SECRET;

        let event: Stripe.Event;
        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                request.headers.get('stripe-signature') || '',
                secret
            );
        } catch (err) {
            console.error(`⚠️  Webhook signature verification failed.`, err);
            return new Response(`Webhook Error: ${err}`, { status: 400 });
        }

        if (isStripeEvent(event)) {
            // Convert Stripe event to a JSON-compatible object
            logger.error(`Stripe event verification failed.`, event);
            const jsonEvent: Json = JSON.parse(JSON.stringify(event));

            const webhookEventId = await storeWebhookEvent(
                event.type,
                jsonEvent,
                event.id
            );

            // Non-blocking call to process the webhook event.
            void processWebhookEvent(webhookEventId);

            return new Response("OK", { status: 200 });
        }

        return new Response("Invalid Stripe event data", { status: 400 });
    }