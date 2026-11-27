import "reflect-metadata";
import {
    Action,
    CodeZeroEvent,
    type DataTypeClass,
    type PlainValue,
    type RuntimeEventClass,
    type RuntimeFunctionClass,
} from "@code0-tech/hercules";
import { AiAgentApprovalDataType } from "./datatypes/agent/Agent.approval.datatype.js";
import { AiAgentStepDataType } from "./datatypes/agent/Agent.step.datatype.js";
import { AiAgentRequestDataType } from "./datatypes/agent/Agent.request.datatype.js";
import { AiAgentResponseDataType } from "./datatypes/agent/Agent.response.datatype.js";
import { AiChatChoiceDataType } from "./datatypes/chat/Chat.choice.datatype.js";
import { AiChatContentPartDataType } from "./datatypes/chat/Chat.contentPart.datatype.js";
import { AiChatMessageDataType } from "./datatypes/chat/Chat.message.datatype.js";
import { AiChatRequestDataType } from "./datatypes/chat/Chat.request.datatype.js";
import { AiChatResponseDataType } from "./datatypes/chat/Chat.response.datatype.js";
import { AiChatRoleDataType } from "./datatypes/chat/Chat.role.datatype.js";
import { AiChatToolCallDataType } from "./datatypes/chat/Chat.toolCall.datatype.js";
import { AiChatUsageDataType } from "./datatypes/chat/Chat.usage.datatype.js";
import { AiMcpServerDataType } from "./datatypes/mcp/Mcp.server.datatype.js";
import { AiMcpTransportDataType } from "./datatypes/mcp/Mcp.transport.datatype.js";
import { AiContentBlockDataType } from "./datatypes/message/Message.contentBlock.datatype.js";
import { AiMessageDataType } from "./datatypes/message/Message.datatype.js";
import { AiMessageRoleDataType } from "./datatypes/message/Message.role.datatype.js";
import { AiToolStatusDataType } from "./datatypes/message/Message.toolStatus.datatype.js";
import { AiAgentStateDataType } from "./datatypes/middleware/Middleware.agentState.datatype.js";
import { AiMiddlewareHookDataType } from "./datatypes/middleware/Middleware.hook.datatype.js";
import { AiStateUpdateDataType } from "./datatypes/middleware/Middleware.stateUpdate.datatype.js";
import { AiModelRequestDataType } from "./datatypes/model/Model.request.datatype.js";
import { AiModelResponseDataType } from "./datatypes/model/Model.response.datatype.js";
import { AiResponseFormatDataType } from "./datatypes/model/Model.responseFormat.datatype.js";
import { AiToolSpecDataType } from "./datatypes/model/Model.toolSpec.datatype.js";

import { CreateAgentFunction } from "./runtimefunctions/agent/Agent.create.runtimefunction.js";
import { SkillsFunction } from "./runtimefunctions/tool/Tool.skills.runtimefunction.js";
import { ExtractInformationFunction } from "./runtimefunctions/extract/Extract.information.runtimefunction.js";
import { McpServerFunction } from "./runtimefunctions/mcp/Mcp.server.runtimefunction.js";
import { HumanInTheLoopMiddlewareFunction } from "./runtimefunctions/middleware/Middleware.humanInTheLoop.runtimefunction.js";
import { TrimMessagesMiddlewareFunction } from "./runtimefunctions/middleware/Middleware.trimMessages.runtimefunction.js";
import { AnthropicModelFunction } from "./runtimefunctions/model/Model.anthropic.runtimefunction.js";
import { GroqModelFunction } from "./runtimefunctions/model/Model.groq.runtimefunction.js";
import { LiteLlmModelFunction } from "./runtimefunctions/model/Model.liteLlm.runtimefunction.js";
import { MistralModelFunction } from "./runtimefunctions/model/Model.mistral.runtimefunction.js";
import { OllamaModelFunction } from "./runtimefunctions/model/Model.ollama.runtimefunction.js";
import { OpenAiModelFunction } from "./runtimefunctions/model/Model.openAi.runtimefunction.js";
import { OpenRouterModelFunction } from "./runtimefunctions/model/Model.openRouter.runtimefunction.js";

import { OpenAiOpenWebUiFormattingFunction } from "./runtimefunctions/openai/OpenAi.openWebUiFormatting.runtimefunction.js";
import { OpenAiRespondFunction } from "./runtimefunctions/openai/OpenAi.respond.runtimefunction.js";

import { AiOpenAiServerRuntimeEvent } from "./runtimeevents/openai/OpenAi.server.runtimeevent.js";
import { startOpenAiServer } from "./server/openai/OpenAi.startServer.js";

import { connectToAquila } from "./utils/shared/Shared.connectToAquila.util.js";

const RECONNECT_DELAY_MS = 5000;

const DATA_TYPES: DataTypeClass[] = [
    AiMessageRoleDataType,
    AiToolStatusDataType,
    AiContentBlockDataType,
    AiMessageDataType,
    AiToolSpecDataType,
    AiResponseFormatDataType,
    AiModelRequestDataType,
    AiModelResponseDataType,

    AiMiddlewareHookDataType,
    AiAgentStateDataType,
    AiStateUpdateDataType,

    AiMcpTransportDataType,
    AiMcpServerDataType,

    AiAgentApprovalDataType,
    AiAgentStepDataType,
    AiAgentRequestDataType,
    AiAgentResponseDataType,

    AiChatRoleDataType,
    AiChatContentPartDataType,
    AiChatToolCallDataType,
    AiChatMessageDataType,
    AiChatRequestDataType,
    AiChatUsageDataType,
    AiChatChoiceDataType,
    AiChatResponseDataType,

];

const RUNTIME_FUNCTIONS: RuntimeFunctionClass[] = [
    CreateAgentFunction,
    SkillsFunction,
    ExtractInformationFunction,
    McpServerFunction,
    HumanInTheLoopMiddlewareFunction,
    OpenAiOpenWebUiFormattingFunction,
    OpenAiRespondFunction,
    AnthropicModelFunction,
    GroqModelFunction,
    LiteLlmModelFunction,
    MistralModelFunction,
    OllamaModelFunction,
    OpenAiModelFunction,
    OpenRouterModelFunction,
    TrimMessagesMiddlewareFunction,
];

/** Events the action itself fires, rather than ones a platform adapter triggers. */
const RUNTIME_EVENTS: RuntimeEventClass[] = [AiOpenAiServerRuntimeEvent];

const action = new Action(
    process.env.ACTION_ID ?? "ai-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:robot",
    "AI agents built from what the project already has: the model they think with, the flows and MCP servers they use as tools, and the rules they follow.",
    [{ code: "en-US", content: "AI" }],
);

DATA_TYPES.forEach((dataType) => action.registerDataTypeClass(dataType));
RUNTIME_FUNCTIONS.forEach((runtimeFunction) => action.registerRuntimeFunction(runtimeFunction));
RUNTIME_EVENTS.forEach((event) => action.registerRuntimeEventClass(event));

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log(`Attempting to reconnect in ${RECONNECT_DELAY_MS / 1000}s...`);
    setTimeout(() => connectToAquila(action), RECONNECT_DELAY_MS);
});

action.on(CodeZeroEvent.moduleUpdated, (message: unknown) => {
    console.dir(message, { depth: null });
    console.dir(action.configs.values(), { depth: null });
});

connectToAquila(action);

// The action serves the OpenAI protocol itself: the server answers on its own port and
// runs the flow a request is for, so it only needs the flows aquila reports and a way
// to execute one.
startOpenAiServer({
    flows: () => action.flows.values(),
    reserveExecutionId: () => action.reserveExecutionId(),
    executeFlowWithId: (executionId: string, flowId: bigint, payload: PlainValue) =>
        action.executeFlowWithId(executionId, flowId, payload),
});

export { action };
