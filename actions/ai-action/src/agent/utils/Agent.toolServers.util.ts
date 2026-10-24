import type { AiMcpServer } from "../../mcp/datatypes/Mcp.server.datatype.js";
import { isSubFlow } from "../../shared/utils/Shared.isSubFlow.util.js";
import type { ToolEntry } from "./Agent.compileAgent.util.js";

export function toolServers(entries: ToolEntry[]): AiMcpServer[] {
    return entries.filter((entry): entry is AiMcpServer => !isSubFlow(entry));
}
