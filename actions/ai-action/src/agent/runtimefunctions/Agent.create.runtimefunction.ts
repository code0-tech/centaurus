import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
    SubFlow,
    ThrowsError,
} from "@code0-tech/hercules";
import type { AiAgentRequest } from "../datatypes/Agent.request.datatype.js";
import type { AiAgentResponse } from "../datatypes/Agent.response.datatype.js";
import type { AiAgentTransform } from "../datatypes/Agent.transform.datatype.js";
import type { AiMiddlewareTransform } from "../../middleware/datatypes/Middleware.transform.datatype.js";
import type { AiModelTransform } from "../../model/datatypes/Model.transform.datatype.js";
import { asList } from "../../shared/utils/Shared.asList.util.js";
import { asSubFlow } from "../../shared/utils/Shared.asSubFlow.util.js";
import { asText } from "../../shared/utils/Shared.asText.util.js";
import { asToolEntries } from "../utils/Agent.asToolEntries.util.js";
import type { AgentDefinition, ToolEntry } from "../utils/Agent.compileAgent.util.js";
import { requireText } from "../../shared/utils/Shared.requireText.util.js";
import { runAgent } from "../utils/Agent.runAgent.util.js";
import { toolServers } from "../utils/Agent.toolServers.util.js";
import { validateMcpServers } from "../../mcp/utils/Mcp.validateMcpServers.util.js";

@Identifier("ai::agent::create")
@DisplayIcon("tabler:robot")
@Signature(
    "(name: TEXT, system_prompt: TEXT, model: TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>, tools?: LIST<((...args: any[]) => any) | AI_MCP_SERVER>, middleware?: LIST<TRANSFORM<AI_AGENT_STATE, AI_STATE_UPDATE>>): TRANSFORM<AI_AGENT_REQUEST, AI_AGENT_RESPONSE>",
)
@Name({ code: "en-US", content: "Create agent" })
@DisplayMessage({ code: "en-US", content: "Create agent ${name}" })
@ThrowsError()
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
})
@Parameter({
    runtimeName: "system_prompt",
    name: [{ code: "en-US", content: "System prompt" }],
})
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
})
@Parameter({
    runtimeName: "tools",
    name: [{ code: "en-US", content: "Tools" }],
    optional: true,
})
@Parameter({
    runtimeName: "middleware",
    name: [{ code: "en-US", content: "Middleware" }],
    optional: true,
})
export class CreateAgentFunction {
    run(
        _context: FunctionContext,
        name: string,
        system_prompt: string,
        model: AiModelTransform,
        tools?: ToolEntry[],
        middleware?: (AiMiddlewareTransform)[],
    ): AiAgentTransform {
        const definition: AgentDefinition = {
            name: requireText(name, "ERROR_INVALID_AI_AGENT", "An agent needs a name."),
            systemPrompt: asText(system_prompt ?? "", "system_prompt", "ERROR_INVALID_AI_AGENT"),
            model: asSubFlow(model, "model"),
            tools: asToolEntries(tools),
            middleware: asList(middleware, "middleware").map((entry, index): SubFlow =>
                asSubFlow(entry, `middleware[${index}]`),
            ),
        };
        validateMcpServers(toolServers(definition.tools));

        return (request: AiAgentRequest): Promise<AiAgentResponse> => runAgent(definition, request);
    }
}
