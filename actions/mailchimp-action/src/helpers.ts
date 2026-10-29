import {createHash} from "node:crypto";
import mailchimp from "@mailchimp/mailchimp_marketing";
import {FunctionContext, RuntimeError} from "@code0-tech/hercules";

/**
 * Configures (and caches) the official Mailchimp Marketing SDK client from the
 * action configuration. Unlike the Stripe/Twilio SDKs, `@mailchimp/mailchimp_marketing`
 * is a singleton module configured via `setConfig` rather than instantiated per
 * client, so we only need to re-apply the config when it changes.
 *
 * The server (datacenter) prefix is required by every Mailchimp API host
 * (`https://<server>.api.mailchimp.com`). It is read from the optional
 * `server_prefix` config, falling back to the suffix of the API key itself
 * (every Mailchimp key ends in `-usX`).
 */
let cached: {apiKey: string; server: string} | null = null;

export function getMailchimpClient(context: FunctionContext): typeof mailchimp {
    const apiKey = context.matchedConfig.findConfig("api_key") as string;
    if (!apiKey) {
        throw new RuntimeError(
            "MAILCHIMP_MISSING_API_KEY",
            "No Mailchimp API key configured. Set the 'api_key' config to your Mailchimp API key."
        );
    }

    const configuredServer = (context.matchedConfig.findConfig("server_prefix") as string) || "";
    const server = configuredServer || apiKey.split("-").pop() || "";
    if (!server) {
        throw new RuntimeError(
            "MAILCHIMP_MISSING_SERVER_PREFIX",
            "Could not determine the Mailchimp server prefix. Configure 'server_prefix' or use an API key ending in '-usX'."
        );
    }

    if (!cached || cached.apiKey !== apiKey || cached.server !== server) {
        mailchimp.setConfig({apiKey, server});
        cached = {apiKey, server};
    }

    return mailchimp;
}

/**
 * Mailchimp member endpoints are addressed by the MD5 hash of the lowercased
 * email address rather than the email itself.
 * See https://mailchimp.com/developer/marketing/docs/methods-parameters/#hashing
 */
export function subscriberHash(email: string): string {
    return createHash("md5").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * Maps an error thrown by the Mailchimp SDK (or anything else) into a
 * Hercules RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error && typeof error === "object" && "response" in error) {
        const response = (error as {response?: {body?: unknown; text?: unknown}}).response;
        const body = response?.body ?? response?.text;
        const detail =
            typeof body === "string"
                ? body
                : ((body as {detail?: string; title?: string} | undefined)?.detail ??
                  (body as {detail?: string; title?: string} | undefined)?.title);
        if (detail) {
            return new RuntimeError(code, String(detail));
        }
    }
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the Mailchimp API.");
}
