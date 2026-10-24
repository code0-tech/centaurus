import type { ClientTool } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import type { AiMcpServer } from "../datatypes/Mcp.server.datatype.js";
import { discoverTools } from "./Mcp.discoverTools.util.js";
import { toConnection } from "./Mcp.toConnection.util.js";
import { validateMcpServers } from "./Mcp.validateMcpServers.util.js";

export interface McpTools {
    tools: ClientTool[];
    close: () => Promise<void>;
}

export async function buildMcpTools(servers: AiMcpServer[]): Promise<McpTools> {
    if (servers.length === 0) return { tools: [], close: async () => undefined };

    validateMcpServers(servers);

    const client = new MultiServerMCPClient({
        mcpServers: Object.fromEntries(servers.map((server) => [server.name, toConnection(server)])),
    });

    const discovered: ClientTool[] = await discoverTools(client);
    const allowed = new Set(servers.flatMap((server) => server.allowed_tools ?? []));
    const tools: ClientTool[] =
        allowed.size === 0
            ? discovered
            : discovered.filter((tool) => allowed.has(tool.name.split("__").pop() ?? tool.name));

    return { tools, close: () => client.close() };
}
