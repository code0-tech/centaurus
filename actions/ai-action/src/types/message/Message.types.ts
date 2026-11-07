import type { AiContentBlock } from "../../datatypes/message/Message.contentBlock.datatype.js";

export interface MessageFields {
    content: AiContentBlock[];
    id?: string;
    name?: string;
    additional_kwargs?: Record<string, unknown>;
    response_metadata?: Record<string, unknown>;
}
