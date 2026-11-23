import { createHmac, timingSafeEqual } from "node:crypto";
import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import { ErrorCode, WebClient, type CodedError } from "@slack/web-api";
import { SlackBlock } from "./data_types/slackBlock.js";

/**
 * Builds a Slack Web API client from the action configuration.
 *
 * Every project brings its own bot token, so a client is created per call
 * instead of being cached. The official `@slack/web-api` SDK handles
 * authentication, retries and rate limit backoff for us.
 */
export function getSlackClient(context: FunctionContext): WebClient {
    const botToken = context.matchedConfig.findConfig("bot_token") as string;
    if (!botToken) {
        throw new RuntimeError(
            "SLACK_MISSING_BOT_TOKEN",
            "No Slack bot token configured. Set the 'bot_token' config to your xoxb-... token."
        );
    }

    return new WebClient(botToken);
}

/**
 * Removes `undefined` values (recursively) from a function result. Hercules
 * serializes results into protobuf values and rejects `undefined`, while
 * optional fields of our objects and zod's output keep such keys around.
 */
export function withoutUndefined<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => withoutUndefined(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, entry]) => entry !== undefined)
                .map(([key, entry]) => [key, withoutUndefined(entry)])
        ) as T;
    }
    return value;
}

/**
 * Slack reports points in time as Unix seconds, while a `DATE` holds Unix
 * microseconds (UTC). Missing values stay missing.
 */
export function fromUnixSeconds(seconds: number | null | undefined): number | null | undefined {
    if (seconds === null || seconds === undefined) {
        return seconds;
    }
    return Math.round(seconds * 1_000_000);
}

/**
 * Maps an error thrown by the Slack SDK (or anything else) into a Hercules
 * RuntimeError with a stable code and a human readable message. Slack reports
 * API-level failures as a platform error carrying a machine readable
 * `data.error` such as `channel_not_found` or `not_in_channel`.
 */
export function toRuntimeError(code: string, error: unknown): RuntimeError {
    if (error instanceof RuntimeError) {
        return error;
    }

    const coded = error as Partial<CodedError> & {
        data?: { error?: string; response_metadata?: { messages?: string[] } };
        retryAfter?: number;
    };
    if (coded?.code === ErrorCode.PlatformError && coded.data?.error) {
        // Errors such as invalid_blocks explain the actual problem in response_metadata.
        const details = coded.data.response_metadata?.messages ?? [];
        const suffix = details.length > 0 ? ` (${details.join("; ")})` : "";
        return new RuntimeError(code, `Slack API error: ${coded.data.error}${suffix}`);
    }
    if (coded?.code === ErrorCode.RateLimitedError) {
        return new RuntimeError(code, `Slack rate limited the request. Retry after ${coded.retryAfter ?? "?"}s.`);
    }
    if (error instanceof Error) {
        return new RuntimeError(code, error.message);
    }
    return new RuntimeError(code, "An unexpected error occurred while calling the Slack API.");
}

/**
 * Block Kit blocks travel through flows as SLACK_BLOCK values. Slack rejects an
 * empty `blocks` array, so an omitted or empty list is sent as no blocks at all.
 * Unset optional fields can come back from the flow as `null`, which Slack also
 * rejects (`invalid_blocks`), so they are dropped before sending.
 */
export function toBlockArgument(blocks?: SlackBlock[] | null): { blocks?: SlackBlock[] } {
    return blocks && blocks.length > 0 ? { blocks: blocks.map((block) => withoutNullish(block)) } : {};
}

/** Recursively removes `null` and `undefined` values. */
function withoutNullish<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.map((entry) => withoutNullish(entry)) as T;
    }
    if (value !== null && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, entry]) => entry !== null && entry !== undefined)
                .map(([key, entry]) => [key, withoutNullish(entry)])
        ) as T;
    }
    return value;
}

/** Requests older than this are rejected by {@link verifyRequestSignature} as replays. */
const SIGNATURE_MAX_AGE_SECONDS = 60 * 5;

/**
 * Verifies the `X-Slack-Signature` / `X-Slack-Request-Timestamp` header pair of
 * an inbound Slack request against the configured signing secret.
 *
 * Slack signs the exact bytes it sent, so `rawBody` must be the unparsed request
 * body — re-serializing a parsed payload will not reproduce the same signature.
 * See https://docs.slack.dev/authentication/verifying-requests-from-slack
 */
export function verifyRequestSignature(
    context: FunctionContext,
    signature: string,
    timestamp: string,
    rawBody: string
): boolean {
    const signingSecret = context.matchedConfig.findConfig("signing_secret") as string;
    if (!signingSecret) {
        throw new RuntimeError(
            "SLACK_MISSING_SIGNING_SECRET",
            "No Slack signing secret configured. Set the 'signing_secret' config to verify inbound requests."
        );
    }

    const requestTime = Number(timestamp);
    if (!Number.isFinite(requestTime)) {
        return false;
    }
    // Reject stale timestamps so a captured request cannot be replayed later.
    if (Math.abs(Math.floor(Date.now() / 1000) - requestTime) > SIGNATURE_MAX_AGE_SECONDS) {
        return false;
    }

    const expected = `v0=${createHmac("sha256", signingSecret).update(`v0:${timestamp}:${rawBody}`).digest("hex")}`;
    const expectedBuffer = Buffer.from(expected, "utf8");
    const actualBuffer = Buffer.from(signature, "utf8");
    if (expectedBuffer.length !== actualBuffer.length) {
        return false;
    }
    return timingSafeEqual(expectedBuffer, actualBuffer);
}
