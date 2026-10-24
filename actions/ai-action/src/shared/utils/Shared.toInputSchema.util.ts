import { toJsonSchema } from "@langchain/core/utils/json_schema";
import { emptyJsonSchema } from "./Shared.emptyJsonSchema.util.js";

export function toInputSchema(schema: unknown): Record<string, unknown> {
    if (!schema) return emptyJsonSchema();

    try {
        return toJsonSchema(schema as never) as Record<string, unknown>;
    } catch {
        return emptyJsonSchema();
    }
}
