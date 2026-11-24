import type { AiResponseFormat } from "../../datatypes/model/Model.responseFormat.datatype.js";

/**
 * The output type an agent asked for, in the OpenAI dialect - what OpenAI itself,
 * OpenRouter and Groq all expect under `response_format`.
 *
 * `strict` is forwarded as asked for, which means the provider requires every nested
 * object to close itself with `"additionalProperties": false` rather than answering
 * loosely.
 */
export function toJsonSchemaFormat(format: AiResponseFormat): Record<string, unknown> {
    return {
        type: "json_schema",
        json_schema: {
            name: format.name,
            schema: format.schema,
            ...(format.description ? { description: format.description } : {}),
            ...(format.strict !== undefined ? { strict: format.strict } : {}),
        },
    };
}
