import type { AiMessage } from "../../message/datatypes/Message.datatype";

export function reportedModel(answer: AiMessage, fallbackModel: string): string {
    const metadata = answer.response_metadata ?? {};
    if (typeof metadata.model_name === "string") return metadata.model_name;
    if (typeof metadata.model === "string") return metadata.model;
    return fallbackModel;
}
