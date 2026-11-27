import type { AiMessage } from "../../datatypes/message/Message.datatype.js";

/**
 * The plain text of a message, which is every text block of it joined.
 *
 * A message carries blocks rather than a string - it may hold tool calls, images or
 * reasoning next to what was said - so reading "what does this message say" is this
 * one step, in one place, instead of in every caller.
 */
export const textOf = (message: AiMessage): string =>
    (message.content ?? [])
        .filter((block) => block.type === "text")
        .map((block) => String(block.text ?? ""))
        .join("");
