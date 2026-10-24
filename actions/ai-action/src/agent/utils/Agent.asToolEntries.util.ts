import { RuntimeError } from "@code0-tech/hercules";
import { AiMcpServerSchema } from "../../mcp/datatypes/Mcp.server.datatype.js";
import { asList } from "../../shared/utils/Shared.asList.util.js";
import type { ToolEntry } from "./Agent.compileAgent.util.js";
import { formatIssues } from "../../shared/utils/Shared.formatIssues.util.js";
import { isSubFlow } from "../../shared/utils/Shared.isSubFlow.util.js";

export function asToolEntries(value: unknown): ToolEntry[] {
    return asList(value, "tools").map((entry, index) => {
        if (isSubFlow(entry)) return entry;

        const server = AiMcpServerSchema.safeParse(entry);
        if (server.success) return server.data;

        throw new RuntimeError(
            "ERROR_INVALID_AI_TOOL",
            `Entry ${index + 1} of "tools" is neither a sub flow nor a valid MCP server: ${formatIssues(server.error.issues)}`,
        );
    });
}
