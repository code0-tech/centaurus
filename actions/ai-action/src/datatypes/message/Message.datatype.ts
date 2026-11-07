import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AiContentBlockSchema } from "./Message.contentBlock.datatype.js";
import { AiMessageRoleSchema } from "./Message.role.datatype.js";
import { AiToolStatusSchema } from "./Message.toolStatus.datatype.js";

export const AiMessageSchema = z.object({
    role: AiMessageRoleSchema,
    content: z.array(AiContentBlockSchema),
    tool_call_id: z.string().optional(),
    name: z.string().optional(),
    id: z.string().optional(),
    status: AiToolStatusSchema.optional(),
    artifact: z.any().optional(),
    additional_kwargs: z.looseObject({}).optional(),
    response_metadata: z.looseObject({}).optional(),
    usage_metadata: z.looseObject({}).optional(),
});
export type AiMessage = z.infer<typeof AiMessageSchema>;

@Identifier("AI_MESSAGE")
@Name({ code: "en-US", content: "Message" })
@DisplayMessage({ code: "en-US", content: "${role} message" })
@Schema(AiMessageSchema)
export class AiMessageDataType {}
