import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * The type an answer has to come back in, as it reaches a model sub flow.
 *
 * It is deliberately provider-neutral: the schema and its name travel, and every
 * model node turns them into whatever its own provider expects - OpenAI's
 * `response_format`, Anthropic's `outputConfig`, Google's `responseSchema`. A model
 * node that cannot constrain its output at all simply leaves the field out of its
 * request schema, which is how it tells the agent to fall back to a tool call.
 */
export const AiResponseFormatSchema = z.object({
    name: z.string(),
    schema: z.looseObject({}),
    description: z.string().optional(),
    strict: z.boolean().optional(),
});
export type AiResponseFormat = z.infer<typeof AiResponseFormatSchema>;

@Identifier("AI_RESPONSE_FORMAT")
@Name({ code: "en-US", content: "Response format" })
@DisplayMessage({ code: "en-US", content: "Response format ${name}" })
@Schema(AiResponseFormatSchema)
export class AiResponseFormatDataType {}
