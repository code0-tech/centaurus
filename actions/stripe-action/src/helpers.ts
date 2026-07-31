import Stripe from "stripe";
import {FunctionContext, RuntimeError} from "@code0-tech/hercules";

/**
 * Builds (and caches) a Stripe client from the action configuration.
 *
 * The client is cached per (secret key, api version) pair so repeated function
 * invocations reuse the same instance. Uses the official `stripe` Node SDK,
 * which handles authentication, retries and idempotency for us.
 */
let cached: {key: string; apiVersion: string; client: Stripe} | null = null;

export function getStripeClient(context: FunctionContext): Stripe {
    const secretKey = context.matchedConfig.findConfig("secret_key") as string;
    if (!secretKey) {
        throw new RuntimeError(
            "STRIPE_MISSING_SECRET_KEY",
            "No Stripe secret key configured. Set the 'secret_key' config to your sk_... key."
        );
    }

    const apiVersion = (context.matchedConfig.findConfig("api_version") as string) || "";

    if (cached && cached.key === secretKey && cached.apiVersion === apiVersion) {
        return cached.client;
    }

    const options: Stripe.StripeConfig = {
        appInfo: {name: "code0-centaurus-stripe-action"},
    };
    // Only pin the API version when the operator explicitly configured one;
    // otherwise the SDK falls back to the account's default pinned version.
    if (apiVersion) {
        options.apiVersion = apiVersion as Stripe.StripeConfig["apiVersion"];
    }

    const client = new Stripe(secretKey, options);
    cached = {key: secretKey, apiVersion, client};
    return client;
}

/**
 * Maps an error thrown by the Stripe SDK (or anything else) into a Hercules
 * RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error instanceof Stripe.errors.StripeError) {
        return new RuntimeError(code, error.message);
    }
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the Stripe API.");
}
