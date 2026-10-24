import { RuntimeError } from "@code0-tech/hercules";
import type { ClientTool } from "@langchain/core/tools";
import type { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";

export async function discoverTools(client: MultiServerMCPClient): Promise<ClientTool[]> {
    try {
        return (await client.getTools()) as unknown as ClientTool[];
    } catch (error) {
        await client.close().catch(() => undefined);
        throw new RuntimeError(
            "ERROR_LOADING_AI_MCP_TOOLS",
            `Could not load tools from the configured MCP servers: ${describeError(error)}`,
        );
    }
}
