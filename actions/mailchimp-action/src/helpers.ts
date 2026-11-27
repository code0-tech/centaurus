import { createHash } from "node:crypto";
import mailchimp from "@mailchimp/mailchimp_marketing";
import { FunctionContext, RuntimeError } from "@code0-tech/hercules";

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
let cached: { apiKey: string; server: string } | null = null;

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
        mailchimp.setConfig({ apiKey, server });
        cached = { apiKey, server };
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
 * Normalizes a birthday into the `MM/DD` format Mailchimp expects for
 * BIRTHDAY merge fields (the year is not stored).
 *
 * Accepted inputs:
 *  - `MM/DD` (passed through after validation)
 *  - ISO dates / timestamps, e.g. `1990-04-23` or `1990-04-23T00:00:00Z`
 *  - `--MM-DD` or `MM-DD`
 *  - anything else `Date` can parse (UTC components are used)
 */
export function formatMailchimpBirthday(value: string): string {
    const input = value.trim();
    const pad = (n: number) => String(n).padStart(2, "0");
    const build = (month: number, day: number): string => {
        // Validate against a leap year so 02/29 is allowed.
        const probe = new Date(Date.UTC(2000, month - 1, day));
        if (month < 1 || month > 12 || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) {
            throw invalidBirthday(value);
        }
        return `${pad(month)}/${pad(day)}`;
    };

    let match = /^(\d{1,2})\/(\d{1,2})$/.exec(input);
    if (match) return build(Number(match[1]), Number(match[2]));

    // Date part of an ISO string, parsed manually to avoid timezone shifts.
    match = /^\d{4}-(\d{2})-(\d{2})(?:$|[T\s])/.exec(input);
    if (match) return build(Number(match[1]), Number(match[2]));

    match = /^(?:--)?(\d{1,2})-(\d{1,2})$/.exec(input);
    if (match) return build(Number(match[1]), Number(match[2]));

    const parsed = new Date(input);
    if (!Number.isNaN(parsed.getTime())) {
        return build(parsed.getUTCMonth() + 1, parsed.getUTCDate());
    }

    throw invalidBirthday(value);
}

function invalidBirthday(value: string): RuntimeError {
    return new RuntimeError(
        "MAILCHIMP_INVALID_BIRTHDAY",
        `Invalid birthday '${value}'. Use 'MM/DD' or an ISO date such as 'YYYY-MM-DD'.`
    );
}

/**
 * Maps an error thrown by the Mailchimp SDK (or anything else) into a
 * Hercules RuntimeError with a stable code and a human readable message.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error && typeof error === "object" && "response" in error) {
        const response = (error as { response?: { body?: unknown; text?: unknown } }).response;
        let body: unknown = response?.body ?? response?.text;

        // response.text ist meist rohes JSON -> parsen
        if (typeof body === "string") {
            let raw = body;
            try {
                body = JSON.parse(raw);
            } catch {
                if (raw) {
                    return new RuntimeError(code, raw);
                }
            }
        }

        if (body && typeof body === "object") {
            const { title, detail, errors } = body as {
                title?: string;
                detail?: string;
                errors?: Array<{ field?: string; message?: string }>;
            };

            const fieldErrors = Array.isArray(errors)
                ? errors
                    .filter((e) => e?.message)
                    .map((e) => (e.field ? `${e.field}: ${e.message}` : String(e.message)))
                : [];

            const message = fieldErrors.length > 0 ? fieldErrors.join("; ") : (detail ?? title);

            if (message) {
                return new RuntimeError(code, String(message));
            }
        }
    }
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the Mailchimp API.");
}