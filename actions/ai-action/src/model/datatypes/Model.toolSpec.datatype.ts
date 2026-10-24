import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const AiToolSpecSchema = z.object({
    name: z.string(),
    description: z.string(),
    input_schema: z.looseObject({}),
});
export type AiToolSpec = z.infer<typeof AiToolSpecSchema>;

@Identifier("AI_TOOL_SPEC")
@Name({ code: "en-US", content: "Tool specification" })
@DisplayMessage({ code: "en-US", content: "Tool ${name}" })
@Schema(AiToolSpecSchema)
export class AiToolSpecDataType {}
