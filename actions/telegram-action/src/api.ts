import { RuntimeError } from "@code0-tech/hercules";

/**
 * A thin client for the Telegram Bot API: every method is a POST of a JSON body
 * to `https://api.telegram.org/bot<token>/<method>`, answered with
 * `{ ok, result }` or `{ ok: false, error_code, description, parameters }`.
 *
 * The bot token is part of the URL, so it must never end up in an error
 * message - neither our own nor one of fetch's.
 */
const API_BASE_URL = "https://api.telegram.org";

interface TelegramResponse<T> {
    ok: boolean;
    result?: T;
    error_code?: number;
    description?: string;
    parameters?: { retry_after?: number; migrate_to_chat_id?: number };
}

export async function callTelegram<T>(
    botToken: string,
    method: string,
    params: Record<string, unknown> = {}
): Promise<T> {
    const token = botToken?.trim();
    if (!token) {
        throw new RuntimeError("TELEGRAM_MISSING_BOT_TOKEN", "No Telegram bot token was given.");
    }

    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}/bot${token}/${method}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(withoutEmpty(params)),
        });
    } catch {
        throw new RuntimeError("TELEGRAM_REQUEST_FAILED", `Could not reach the Telegram Bot API for ${method}.`);
    }

    let body: TelegramResponse<T>;
    try {
        body = (await response.json()) as TelegramResponse<T>;
    } catch {
        throw new RuntimeError(
            "TELEGRAM_INVALID_RESPONSE",
            `The Telegram Bot API answered ${method} with HTTP ${response.status} and no JSON body.`
        );
    }

    if (!body.ok) throw telegramError(method, body, response.status);
    return body.result as T;
}

function telegramError(method: string, body: TelegramResponse<unknown>, status: number): RuntimeError {
    const code = body.error_code ?? status;
    const description = body.description ?? `HTTP ${status}`;

    switch (code) {
        case 400:
            return new RuntimeError("TELEGRAM_BAD_REQUEST", `${method}: ${description}`);
        case 401:
            return new RuntimeError("TELEGRAM_UNAUTHORIZED", `${method}: the bot token was rejected (${description}).`);
        case 403:
            return new RuntimeError("TELEGRAM_FORBIDDEN", `${method}: ${description}`);
        case 404:
            // Telegram answers an unknown token with 404 as well as 401.
            return new RuntimeError("TELEGRAM_NOT_FOUND", `${method}: ${description}`);
        case 429: {
            const retryAfter = body.parameters?.retry_after;
            return new RuntimeError(
                "TELEGRAM_RATE_LIMITED",
                retryAfter !== undefined
                    ? `${method}: too many requests, retry after ${retryAfter} seconds.`
                    : `${method}: too many requests.`
            );
        }
        default:
            return new RuntimeError(`TELEGRAM_API_ERROR_${code}`, `${method}: ${description}`);
    }
}

/**
 * A flow passes an optional parameter it left empty as `undefined`, `null` or
 * `""`. Telegram treats a present-but-empty field as a value (e.g. an empty
 * `parse_mode` is rejected), so they are left out of the request.
 */
function withoutEmpty(params: Record<string, unknown>): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
}
