import { RemoveMessage, type BaseMessage } from "@langchain/core/messages";
import type { AiMessage } from "../datatypes/Message.datatype.js";
import { toLangChainMessage } from "./Message.toLangChainMessage.util.js";

export function replaceMessages(previous: BaseMessage[], next: AiMessage[]): BaseMessage[] {
    const removals = previous
        .filter((message): message is BaseMessage & { id: string } => typeof message.id === "string")
        .map((message) => new RemoveMessage({ id: message.id }));

    return [...removals, ...next.map(toLangChainMessage)];
}
