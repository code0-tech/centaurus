import { PlainValue, RuntimeError } from "@code0-tech/hercules";
import { TelegramUserType } from "./data_types/telegramUser.js";
import { TelegramChatDataType, TelegramChatTypeType } from "./data_types/telegramChat.js";
import { TelegramMessageType } from "./data_types/telegramMessage.js";
import { TelegramCallbackQueryType } from "./data_types/telegramCallbackQuery.js";
import { TelegramInlineKeyboardButtonType } from "./data_types/telegramInlineKeyboardButton.js";

/** The parts of the Bot API objects the action reads (snake_case, as Telegram sends them). */
export interface ApiUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
}

export interface ApiChat {
    id: number;
    type: TelegramChatTypeType;
    title?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
}

export interface ApiMessage {
    message_id: number;
    chat: ApiChat;
    from?: ApiUser;
    date: number;
    edit_date?: number;
    text?: string;
    caption?: string;
    reply_to_message?: { message_id: number };
    photo?: { file_id: string; width: number; height: number }[];
    document?: { file_id: string };
}

export interface ApiCallbackQuery {
    id: string;
    from: ApiUser;
    message?: ApiMessage;
    inline_message_id?: string;
    chat_instance: string;
    data?: string;
}

export interface ApiUpdate {
    update_id: number;
    message?: ApiMessage;
    callback_query?: ApiCallbackQuery;
}

/**
 * The mappers fill every field a data type declares, using `null` for what
 * Telegram did not send: a field missing from the payload has no reference in
 * the flow's value store, so a flow reading e.g. `caption` of a text message
 * would fail - an explicit null gives it something to read.
 *
 * Ids are passed on as strings. A chat id can be used wherever a function takes
 * one, and functions also accept `@channelusername` there.
 */
export function mapTelegramUser(user: ApiUser): TelegramUserType {
    return {
        id: String(user.id),
        isBot: user.is_bot,
        firstName: user.first_name,
        lastName: user.last_name ?? null,
        username: user.username ?? null,
        languageCode: user.language_code ?? null,
    };
}

export function mapTelegramChat(chat: ApiChat): TelegramChatDataType {
    return {
        id: String(chat.id),
        type: chat.type,
        title: chat.title ?? null,
        username: chat.username ?? null,
        firstName: chat.first_name ?? null,
        lastName: chat.last_name ?? null,
    };
}

export function mapTelegramMessage(message: ApiMessage): TelegramMessageType {
    // Telegram lists a photo in every size it has, smallest first.
    const largestPhoto = message.photo?.reduce((largest, size) =>
        size.width * size.height > largest.width * largest.height ? size : largest
    );

    return {
        messageId: message.message_id,
        chat: mapTelegramChat(message.chat),
        from: message.from ? mapTelegramUser(message.from) : null,
        date: unixToIso(message.date),
        editDate: message.edit_date ? unixToIso(message.edit_date) : null,
        text: message.text ?? null,
        caption: message.caption ?? null,
        replyToMessageId: message.reply_to_message?.message_id ?? null,
        photoFileId: largestPhoto?.file_id ?? null,
        documentFileId: message.document?.file_id ?? null,
    };
}

export function mapTelegramCallbackQuery(query: ApiCallbackQuery): TelegramCallbackQueryType {
    return {
        id: query.id,
        from: mapTelegramUser(query.from),
        message: query.message ? mapTelegramMessage(query.message) : null,
        inlineMessageId: query.inline_message_id ?? null,
        chatInstance: query.chat_instance,
        data: query.data ?? null,
    };
}

function unixToIso(seconds: number): string {
    return new Date(seconds * 1000).toISOString();
}

/** Telegram limits the callback data of a button to 64 bytes. */
const MAX_CALLBACK_DATA_BYTES = 64;

/**
 * Turn the rows of buttons a flow passes into Telegram's `reply_markup`.
 * Rows without a usable button are dropped, so no keyboard at all is `undefined`.
 */
export function buildInlineKeyboard(
    rows?: TelegramInlineKeyboardButtonType[][] | null
): { inline_keyboard: Record<string, string>[][] } | undefined {
    if (!Array.isArray(rows)) return undefined;

    const keyboard = rows
        .filter(Array.isArray)
        .map((row) => row.map(toApiButton))
        .filter((row) => row.length > 0);

    return keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined;
}

function toApiButton(button: TelegramInlineKeyboardButtonType): Record<string, string> {
    const text = button?.text?.trim();
    if (!text) {
        throw new RuntimeError("TELEGRAM_INVALID_KEYBOARD", "Every inline keyboard button needs a text.");
    }

    const url = button.url?.trim();
    const callbackData = button.callbackData ?? undefined;

    if (url && callbackData) {
        throw new RuntimeError(
            "TELEGRAM_INVALID_KEYBOARD",
            `The button "${text}" has both a url and callback data - Telegram allows only one of them.`
        );
    }
    if (url) return { text, url };
    if (!callbackData) {
        throw new RuntimeError("TELEGRAM_INVALID_KEYBOARD", `The button "${text}" needs either a url or callback data.`);
    }
    if (Buffer.byteLength(callbackData, "utf8") > MAX_CALLBACK_DATA_BYTES) {
        throw new RuntimeError(
            "TELEGRAM_INVALID_KEYBOARD",
            `The callback data of the button "${text}" is longer than ${MAX_CALLBACK_DATA_BYTES} bytes.`
        );
    }
    return { text, callback_data: callbackData };
}

/** `reply_parameters` replaces the deprecated `reply_to_message_id`. */
export function replyParameters(replyToMessageId?: number | null): { message_id: number } | undefined {
    return typeof replyToMessageId === "number" ? { message_id: replyToMessageId } : undefined;
}

export function toEventPayload<T>(value: T): PlainValue {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) return value.map((entry) => toEventPayload(entry));
    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toEventPayload(entry)])
        );
    }

    return value as PlainValue;
}
