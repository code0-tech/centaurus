import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiContentBlockSchema = z.looseObject({ type: z.string() });
export type AiContentBlock = z.infer<typeof AiContentBlockSchema>;

@Identifier("AI_CONTENT_BLOCK")
@Name({ code: "en-US", content: "Content block" })
@DisplayMessage({ code: "en-US", content: "${type} block" })
@Schema(AiContentBlockSchema)
export class AiContentBlockDataType {}
