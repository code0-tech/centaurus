import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import { DECIDED } from "./Approval.markers.util.js";
import { textOf } from "../message/Message.textOf.util.js";

/** The question with its code marked as used, so it cannot be used twice. */
export const settle = (message: AiMessage, code: string): AiMessage => ({
    ...message,
    content: [{ type: "text", text: `${textOf(message)}\n\n${DECIDED} ${code}` }],
});
