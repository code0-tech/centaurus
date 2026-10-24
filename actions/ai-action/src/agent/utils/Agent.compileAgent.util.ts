import { RuntimeError, type SubFlow } from "@code0-tech/hercules";
import type { ClientTool } from "@langchain/core/tools";
import { createAgent, type ReactAgent } from "langchain";
import type { AiMcpServer } from "../../mcp/datatypes/Mcp.server.datatype.js";
import { buildFlowMiddlewares } from "../../middleware/utils/Middleware.buildFlowMiddlewares.util.js";
import { buildFlowTools } from "./Agent.buildFlowTools.util.js";
import { buildMcpTools } from "../../mcp/utils/Mcp.buildMcpTools.util.js";
import { describeError } from "../../shared/utils/Shared.describeError.util.js";
import { FlowChatModel } from "../../model/utils/Model.flowChatModel.util.js";
import { isSubFlow } from "../../shared/utils/Shared.isSubFlow.util.js";
import { toolServers } from "./Agent.toolServers.util.js";

export type ToolEntry = SubFlow | AiMcpServer;

export interface AgentDefinition {
    name: string;
    systemPrompt: string;
    model: SubFlow;
    tools: ToolEntry[];
    middleware: SubFlow[];
}

export interface CompiledAgent {
    agent: ReactAgent;
    close: () => Promise<void>;
}

export async function compileAgent(definition: AgentDefinition): Promise<CompiledAgent> {
    const { tools: mcpTools, close } = await buildMcpTools(toolServers(definition.tools));

    try {
        const tools: ClientTool[] = [...buildFlowTools(definition.tools.filter(isSubFlow)), ...mcpTools];
        const agent = createAgent({
            model: new FlowChatModel({ run: definition.model }),
            tools,
            middleware: buildFlowMiddlewares(definition.middleware, definition.name),
            name: definition.name,
            ...(definition.systemPrompt ? { systemPrompt: definition.systemPrompt } : {}),
        } as never) as unknown as ReactAgent;

        return { agent, close };
    } catch (error) {
        await close().catch(() => undefined);
        if (error instanceof RuntimeError) throw error;
        throw new RuntimeError(
            "ERROR_BUILDING_AI_AGENT",
            `Could not build agent "${definition.name}": ${describeError(error)}`,
        );
    }
}
