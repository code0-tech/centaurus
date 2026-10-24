import type { BindToolsInput } from "@langchain/core/language_models/chat_models";
import { isLangChainTool } from "@langchain/core/tools";
import type { AiToolSpec } from "../datatypes/Model.toolSpec.datatype.js";
import { toInputSchema } from "../../shared/utils/Shared.toInputSchema.util.js";

export function toToolSpec(tool: BindToolsInput): AiToolSpec {
    const definition = tool as { name?: string; description?: string; input_schema?: unknown; schema?: unknown };
    const schema: unknown = isLangChainTool(tool) ? tool.schema : (definition.input_schema ?? definition.schema);

    return {
        name: definition.name ?? "unknown",
        description: definition.description ?? "",
        input_schema: toInputSchema(schema),
    };
}
