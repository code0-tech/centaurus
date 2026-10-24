import "reflect-metadata";
import { Action, CodeZeroEvent, type DataTypeClass, type RuntimeFunctionClass } from "@code0-tech/hercules";
import { AiAgentRequestDataType } from "./agent/datatypes/Agent.request.datatype.js";
import { AiAgentResponseDataType } from "./agent/datatypes/Agent.response.datatype.js";
import { AiChatChoiceDataType } from "./chat/datatypes/Chat.choice.datatype.js";
import { AiChatContentPartDataType } from "./chat/datatypes/Chat.contentPart.datatype.js";
import { AiChatMessageDataType } from "./chat/datatypes/Chat.message.datatype.js";
import { AiChatRequestDataType } from "./chat/datatypes/Chat.request.datatype.js";
import { AiChatResponseDataType } from "./chat/datatypes/Chat.response.datatype.js";
import { AiChatRoleDataType } from "./chat/datatypes/Chat.role.datatype.js";
import { AiChatToolCallDataType } from "./chat/datatypes/Chat.toolCall.datatype.js";
import { AiChatUsageDataType } from "./chat/datatypes/Chat.usage.datatype.js";
import { AiMcpServerDataType } from "./mcp/datatypes/Mcp.server.datatype.js";
import { AiMcpTransportDataType } from "./mcp/datatypes/Mcp.transport.datatype.js";
import { AiContentBlockDataType } from "./message/datatypes/Message.contentBlock.datatype.js";
import { AiMessageDataType } from "./message/datatypes/Message.datatype.js";
import { AiMessageRoleDataType } from "./message/datatypes/Message.role.datatype.js";
import { AiToolStatusDataType } from "./message/datatypes/Message.toolStatus.datatype.js";
import { AiAgentStateDataType } from "./middleware/datatypes/Middleware.agentState.datatype.js";
import { AiMiddlewareHookDataType } from "./middleware/datatypes/Middleware.hook.datatype.js";
import { AiStateUpdateDataType } from "./middleware/datatypes/Middleware.stateUpdate.datatype.js";
import { AiModelRequestDataType } from "./model/datatypes/Model.request.datatype.js";
import { AiModelResponseDataType } from "./model/datatypes/Model.response.datatype.js";
import { AiToolSpecDataType } from "./model/datatypes/Model.toolSpec.datatype.js";
import { AiWebSearchHitDataType } from "./websearch/datatypes/WebSearch.hit.datatype.js";
import { AiWebSearchResultDataType } from "./websearch/datatypes/WebSearch.result.datatype.js";

import { CreateAgentFunction } from "./agent/runtimefunctions/Agent.create.runtimefunction.js";
import { InvokeAgentFunction } from "./agent/runtimefunctions/Agent.invoke.runtimefunction.js";
import { TrimMessagesMiddlewareFunction } from "./middleware/runtimefunctions/Middleware.trimMessages.runtimefunction.js";
import { OpenRouterModelFunction } from "./model/runtimefunctions/Model.openRouter.runtimefunction.js";
import { WebSearchToolFunction } from "./websearch/runtimefunctions/WebSearch.search.runtimefunction.js";

import { connectToAquila } from "./shared/utils/Shared.connectToAquila.util.js";

const RECONNECT_DELAY_MS = 5000;

const DATA_TYPES: DataTypeClass[] = [
    AiMessageRoleDataType,
    AiToolStatusDataType,
    AiContentBlockDataType,
    AiMessageDataType,
    AiToolSpecDataType,
    AiModelRequestDataType,
    AiModelResponseDataType,

    AiMiddlewareHookDataType,
    AiAgentStateDataType,
    AiStateUpdateDataType,

    AiMcpTransportDataType,
    AiMcpServerDataType,

    AiWebSearchHitDataType,
    AiWebSearchResultDataType,

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
    InvokeAgentFunction,
    OpenRouterModelFunction,
    TrimMessagesMiddlewareFunction,
    WebSearchToolFunction,
];

const action = new Action(
    process.env.ACTION_ID ?? "ai-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:robot",
    "AI agent integration: build LangChain agents whose model, tools and middleware are flows of the project itself.",
    [{ code: "en-US", content: "AI" }],
);

DATA_TYPES.forEach((dataType) => action.registerDataTypeClass(dataType));
RUNTIME_FUNCTIONS.forEach((runtimeFunction) => action.registerRuntimeFunction(runtimeFunction));

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log(`Attempting to reconnect in ${RECONNECT_DELAY_MS / 1000}s...`);
    setTimeout(() => connectToAquila(action), RECONNECT_DELAY_MS);
});

connectToAquila(action);

export { action };
