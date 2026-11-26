import { RuntimeError } from "@code0-tech/hercules";
import { ErrorCode, WebClient, type CodedError } from "@slack/web-api";
import { SlackBotToken } from "./data_types/slackTokens.js";
import { SlackEmbed } from "./data_types/slackEmbed.js";

/**
 * Builds a Slack Web API client for the given bot token.
 *
 * Every flow brings its own bot token, so a client is created per call
 * instead of being cached. The official `@slack/web-api` SDK handles
 * authentication, retries and rate limit backoff for us.
 */
export function getSlackClient(token: SlackBotToken | null | undefined): WebClient {
    const botToken = typeof token === "string" ? token.trim() : "";
    if (!botToken) {
        throw new RuntimeError(
            "SLACK_MISSING_BOT_TOKEN",
            "No Slack bot token given. Set the bot token parameter to your xoxb-... token."
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
 * Turns a message timestamp or a Slack message link
 * (`…/archives/C0123ABC/p1712345678123456`) into Slack's `1712345678.123456`
 * form, so the copied link works as well as the timestamp itself.
 */
export function normalizeMessageTs(value: string): string {
    const linked = /\/p(\d{7,})(?:[/?#]|$)/.exec(value);
    const digits = linked ? linked[1] : value.trim().replace(/^p/, "");
    return /^\d{7,}$/.test(digits) ? `${digits.slice(0, -6)}.${digits.slice(-6)}` : value.trim();
}

/**
 * A Slack message timestamp (`1712345678.123456`) is Unix seconds with six
 * decimals, i.e. a point in time in microseconds - exactly what a `DATE`
 * holds. The conversion is lossless, so a message's `ts` can travel through a
 * flow as a `DATE` and still identify the message.
 */
export function fromSlackTs(ts: string | null | undefined): number | null | undefined {
    if (ts === null || ts === undefined) {
        return ts;
    }
    const match = /^(\d+)(?:\.(\d{1,6}))?$/.exec(String(ts).trim());
    if (!match) {
        return undefined;
    }
    return Number(match[1]) * 1_000_000 + Number((match[2] ?? "").padEnd(6, "0"));
}

/**
 * The inverse of {@link fromSlackTs}: turns a `DATE` back into the timestamp
 * Slack identifies the message by. A text value (a timestamp or a copied
 * message link) is accepted as well.
 */
export function toSlackTs(value: number | string | null | undefined, code: string): string {
    if (typeof value === "string" && value.trim()) {
        return normalizeMessageTs(value);
    }
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        throw new RuntimeError(code, "No valid message timestamp given.");
    }
    const micros = Math.round(value);
    return `${Math.floor(micros / 1_000_000)}.${String(micros % 1_000_000).padStart(6, "0")}`;
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

/** A trimmed text, or `undefined` for null, undefined and blank values. */
function given(value: string | null | undefined): string | undefined {
    const trimmed = typeof value === "string" ? value.trim() : undefined;
    return trimmed ? trimmed : undefined;
}

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

/** Slack allows at most 10 fields per section block. */
const FIELDS_PER_SECTION = 10;

// Block Kit blocks are an implementation detail of the embed, so they stay untyped here.
export type Block = Record<string, unknown>;

/**
 * Turns a {@link SlackEmbed} into Block Kit blocks: a header for the title, a
 * section for the text (with the thumbnail next to it), sections of two column
 * fields, an image block and a context block for the footer.
 */
export function embedToBlocks(embed: SlackEmbed | null | undefined): Block[] {
    if (!embed) {
        return [];
    }

    const title = given(embed.title);
    const text = given(embed.text);
    const imageUrl = given(embed.imageUrl);
    const thumbnailUrl = given(embed.thumbnailUrl);
    const footer = given(embed.footer);
    const fields = (embed.fields ?? [])
        .map((field) => ({ name: given(field?.name), value: given(field?.value) }))
        .filter((field) => field.name || field.value)
        .map((field) => ({
            type: "mrkdwn",
            text: truncate([field.name && `*${field.name}*`, field.value].filter(Boolean).join("\n"), 2000),
        }));

    const blocks: Block[] = [];
    // The thumbnail is the accessory of the first section, whichever that is.
    let thumbnail: Block | undefined = thumbnailUrl
        ? { type: "image", image_url: thumbnailUrl, alt_text: title ?? "Thumbnail" }
        : undefined;
    const withThumbnail = (section: Block): Block => {
        if (!thumbnail) return section;
        const accessory = thumbnail;
        thumbnail = undefined;
        return { ...section, accessory };
    };

    if (title) {
        // Header blocks only take plain text.
        blocks.push({ type: "header", text: { type: "plain_text", text: truncate(title, 150), emoji: true } });
    }
    if (text) {
        blocks.push(withThumbnail({ type: "section", text: { type: "mrkdwn", text: truncate(text, 3000) } }));
    }
    for (let index = 0; index < fields.length; index += FIELDS_PER_SECTION) {
        blocks.push(withThumbnail({ type: "section", fields: fields.slice(index, index + FIELDS_PER_SECTION) }));
    }
    if (thumbnail) {
        // There is no section to show the thumbnail next to, so it becomes an image.
        blocks.push(thumbnail);
    }
    if (imageUrl) {
        blocks.push({ type: "image", image_url: imageUrl, alt_text: title ?? "Image" });
    }
    if (footer) {
        blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: truncate(footer, 3000) }] });
    }
    return blocks;
}

/**
 * Builds the `text`/`blocks` arguments of a chat call from a plain text and an
 * optional embed. Slack shows `text` in notifications, so a message with only
 * an embed falls back to the embed's title or text there.
 */
export function buildMessageContent(
    code: string,
    text: string | null | undefined,
    embed: SlackEmbed | null | undefined
): { text: string; blocks?: Block[] } {
    const blocks = embedToBlocks(embed);
    const plain = given(text);

    if (!plain && blocks.length === 0) {
        throw new RuntimeError(code, "A Slack message needs a text or an embed with content.");
    }
    if (blocks.length === 0) {
        return { text: plain! };
    }
    // With blocks Slack only renders the blocks, so the text becomes the first section.
    const body: Block[] = plain ? [{ type: "section", text: { type: "mrkdwn", text: truncate(plain, 3000) } }] : [];
    return {
        text: plain ?? given(embed?.title) ?? given(embed?.text) ?? "New message",
        blocks: [...body, ...blocks],
    };
}

const MENTION = /^<@([UW][A-Z0-9]+)(?:\|[^>]*)?>$/;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Resolves the ways a flow can name a workspace member into user IDs: a user
 * ID (`U0123456789`), a mention as it appears in message text (`<@U0123456789>`)
 * or an email address, which is looked up via `users.lookupByEmail`.
 */
export async function resolveUserIds(client: WebClient, users: string[], code: string): Promise<string[]> {
    const ids = await Promise.all(
        users
            .map((user) => given(user))
            .filter((user): user is string => user !== undefined)
            .map(async (user) => {
                const mention = MENTION.exec(user);
                if (mention) {
                    return mention[1];
                }
                if (EMAIL.test(user)) {
                    const id = await client.users
                        .lookupByEmail({ email: user })
                        .then((result) => result.user?.id)
                        .catch((error: { data?: { error?: string } }) => {
                            if (error?.data?.error === "users_not_found") return undefined;
                            throw error;
                        });
                    if (!id) {
                        throw new RuntimeError(code, `No Slack user found for the email address ${user}.`);
                    }
                    return id;
                }
                return user;
            })
    );
    return [...new Set(ids)];
}
