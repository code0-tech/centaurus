import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    SubFlow,
    ThrowsError,
} from "@code0-tech/hercules";
import type { ClientTool } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createAgent, createMiddleware, tool, type AnyAgentMiddleware, type ReactAgent } from "langchain";
import type { AiAgentApproval } from "../../datatypes/agent/Agent.approval.datatype.js";
import { AiAgentRequestSchema, type AiAgentRequest } from "../../datatypes/agent/Agent.request.datatype.js";
import { AiAgentResponseSchema, type AiAgentResponse } from "../../datatypes/agent/Agent.response.datatype.js";
import type { AiAgentStep } from "../../datatypes/agent/Agent.step.datatype.js";
import type { AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import { AiChatRequestSchema, type AiChatRequest } from "../../datatypes/chat/Chat.request.datatype.js";
import { AiMcpServerSchema, type AiMcpServer } from "../../datatypes/mcp/Mcp.server.datatype.js";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import type { AgentDefinition, ToolEntry } from "../../types/agent/Agent.types.js";
import type { Logger } from "../../types/shared/Log.types.js";
import { asList } from "../../utils/shared/Shared.asList.util.js";
import { asSubFlow } from "../../utils/shared/Shared.asSubFlow.util.js";
import { asText } from "../../utils/shared/Shared.asText.util.js";
import { codeOf } from "../../utils/middleware/Approval.codeOf.util.js";
import { createHookHandler } from "../../utils/middleware/Middleware.createHookHandler.util.js";
import { DECIDED } from "../../utils/middleware/Approval.markers.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { emptyJsonSchema } from "../../utils/shared/Shared.emptyJsonSchema.util.js";
import { FlowChatModel } from "../../model/Model.flowChatModel.js";
import { formatIssues } from "../../utils/shared/Shared.formatIssues.util.js";
import { fromChatMessage } from "../../utils/chat/Chat.fromChatMessage.util.js";
import { isSubFlow } from "../../utils/shared/Shared.isSubFlow.util.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";
import { textOf } from "../../utils/message/Message.textOf.util.js";
import { toChatResponse } from "../../utils/chat/Chat.toChatResponse.util.js";
import { toConnection } from "../../utils/mcp/Mcp.toConnection.util.js";
import { toFlowMessage } from "../../utils/message/Message.toFlowMessage.util.js";
import { toLangChainMessage } from "../../utils/message/Message.toLangChainMessage.util.js";
import { toPlainSchema } from "../../utils/shared/Shared.toPlainSchema.util.js";

/** What the model APIs accept as a tool name: letters, digits, underscore, dash. */
const TOOL_NAME_ALLOWED = /[^a-zA-Z0-9_-]+/g;

/** Where a middleware may send the run instead of letting it carry on. */
const JUMP_TARGETS = ["model", "tools", "end"] as const;

/**
 * What the extraction turn asks for, once the agent has finished working.
 *
 * The conversation is handed over as one message rather than replayed turn by turn:
 * this call binds no tools, and a conversation that still carries tool calls without
 * the tools they belong to is rejected by some providers. Flattened to text it asks
 * nothing of the provider but the type.
 */
const EXTRACTION_PROMPT =
    "The conversation above is finished. Answer with what it produced, in the type you were given, and add nothing that was not said in it.";

@Identifier("ai::agent::create")
@DisplayIcon("tabler:ai")
@Signature(
    "<T extends TYPE>(name: TEXT, system_prompt: TEXT, model: TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>, prompt: TEXT, tools?: LIST<((...args: any[]) => any) | AI_MCP_SERVER>, output_schema?: T, request?: AI_CHAT_REQUEST, middleware?: LIST<TRANSFORM<AI_AGENT_STATE, AI_STATE_UPDATE>>): AI_CHAT_RESPONSE & { structured_response: T }",
)
@Name({ code: "en-US", content: "Create agent" })
@DisplayMessage({ code: "en-US", content: "Ask the agent ${name} ${prompt}" })
@ThrowsError()
@Parameter({
    runtimeName: "name",
    name: [{ code: "en-US", content: "Name" }],
    description: [
        {
            code: "en-US",
            content:
                "The agent's own name. It identifies the agent in the node's message and in the logs, and is what an error names when the agent fails.",
        },
    ],
})
@Parameter({
    runtimeName: "system_prompt",
    name: [{ code: "en-US", content: "System prompt" }],
    description: [
        {
            code: "en-US",
            content:
                "The standing instructions the agent works under - its role, what it may and may not do, how the answer should read. They are sent ahead of every turn, so they hold for the whole conversation rather than for this prompt alone.",
        },
    ],
})
@Parameter({
    runtimeName: "model",
    name: [{ code: "en-US", content: "Model" }],
    description: [
        {
            code: "en-US",
            content:
                "The model the agent thinks with, built by one of the model nodes. The model decides which provider is called and on what key; the agent only hands it the conversation and the tools.",
        },
    ],
})
@Parameter({
    runtimeName: "prompt",
    name: [{ code: "en-US", content: "Prompt" }],
    description: [
        {
            code: "en-US",
            content:
                "The question put to the agent in this run. It is appended to the messages the request already carries, so it is the last thing the agent reads before answering. It may be left empty when the request already carries the question.",
        },
    ],
})
@Parameter({
    runtimeName: "tools",
    name: [{ code: "en-US", content: "Tools" }],
    description: [
        {
            code: "en-US",
            content:
                "What the agent may reach for while it works: flows of this project, each offered as a tool under its own name, and MCP servers, whose tools are discovered on connect. The agent decides on its own which of them to call, and how often.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "output_schema",
    name: [{ code: "en-US", content: "Output type" }],
    description: [
        {
            code: "en-US",
            content:
                "The data type the answer has to come back in, so the flow can read the fields instead of parsing prose. It has to be an object type; left empty, the agent answers in plain text.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "request",
    name: [{ code: "en-US", content: "Request" }],
    description: [
        {
            code: "en-US",
            content:
                "A conversation to continue, in the chat format an OpenAI-compatible client sends. Its messages go ahead of the prompt, which is how a chat endpoint hands the agent everything that was said before.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "middleware",
    name: [{ code: "en-US", content: "Middleware" }],
    description: [
        {
            code: "en-US",
            content:
                "Steps that sit between the agent and its model and may change what happens on each turn - trimming the conversation, asking before a tool runs. They are applied in the order they are listed.",
        },
    ],
    optional: true,
})
export class CreateAgentFunction {
    /**
     * Builds the agent and runs it in one node, rather than returning the agent for a
     * second node to invoke. A returned agent would be a sub flow function, and the
     * sub flow references it carries - its model above all - only live while the node
     * that minted them is outstanding, so an agent invoked by a later node can never
     * reach its model (see code0-tech/taurus#346). Running it here keeps this node's
     * call open for as long as the agent works, which is exactly what those
     * references are scoped to.
     *
     * The parameters are ordered by how often a flow reaches for them: what every
     * agent needs first, then the tools and the answer's type, and the conversation
     * and middleware knobs last.
     */
    async run(
        _context: FunctionContext,
        name: string,
        system_prompt: string,
        model: unknown,
        prompt: string,
        tools?: ToolEntry[],
        output_schema?: unknown,
        request?: AiChatRequest,
        middleware?: unknown[],
    ): Promise<AiChatResponse> {
        const log: Logger = logger("agent", _context.executionId);
        const toolLog: Logger = logger("tool", _context.executionId);
        log.info(`the node asks the agent "${name}"`, {
            prompt,
            tools: Array.isArray(tools) ? tools.length : 0,
            middleware: Array.isArray(middleware) ? middleware.length : 0,
            request,
            output_schema,
        });

        // The "output_schema" parameter is a TYPE: the data type the flow wants the
        // agent to answer in. Its value reaches the action as that type's JSON schema
        // - as a protobuf Struct when aquila wrapped it, which `toPlainSchema`
        // unwraps either way. langchain only accepts a plain JSON schema as a
        // response format when it describes an object (it keys off `properties`), and
        // a structured answer has to be an object anyway to come back as a data
        // type's value, so a schema for anything else is rejected here rather than
        // deep inside the agent.
        let outputSchema: Record<string, unknown> | undefined;
        if (output_schema !== undefined && output_schema !== null) {
            outputSchema = toPlainSchema(output_schema);
            if (!outputSchema || typeof outputSchema !== "object") {
                throw new RuntimeError(
                    "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                    `The "output_schema" parameter has to be a type, but a ${typeof output_schema} was passed.`,
                );
            }
            if (!("properties" in outputSchema)) {
                throw new RuntimeError(
                    "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                    'The agent can only answer in an object type: the type passed as "output_schema" has no properties.',
                );
            }
        }

        const definition: AgentDefinition = {
            name: requireText(name, "ERROR_INVALID_AI_AGENT", "An agent needs a name."),
            systemPrompt: asText(system_prompt ?? "", "system_prompt", "ERROR_INVALID_AI_AGENT"),
            model: asSubFlow(model, "model"),
            // A tool is either a flow of the project or an MCP server; which entry was
            // neither is part of the error, because that is what makes it fixable.
            tools: asList(tools, "tools").map((entry, index): ToolEntry => {
                if (isSubFlow(entry)) return entry;

                const server = AiMcpServerSchema.safeParse(entry);
                if (server.success) return server.data;

                throw new RuntimeError(
                    "ERROR_INVALID_AI_TOOL",
                    `Entry ${index + 1} of "tools" is neither a sub flow nor a valid MCP server: ${formatIssues(server.error.issues)}`,
                );
            }),
            middleware: asList(middleware, "middleware").map((entry, index): SubFlow =>
                asSubFlow(entry, `middleware[${index}]`),
            ),
            ...(outputSchema ? { outputSchema } : {}),
        };

        const servers: AiMcpServer[] = definition.tools.filter((entry): entry is AiMcpServer => !isSubFlow(entry));

        // MCP tool names are namespaced with the server name, so the names have to be
        // unique; and every connection is built here, where a server that cannot be
        // connected to fails the node rather than a tool call deep inside the agent.
        const serverNames: string[] = servers.map((server) => server.name);
        const duplicate: string | undefined = serverNames.find(
            (named, index) => serverNames.indexOf(named) !== index,
        );
        if (duplicate) {
            throw new RuntimeError(
                "ERROR_DUPLICATE_AI_MCP_SERVER",
                `More than one MCP server is named "${duplicate}". MCP tool names are namespaced with the server name, so the names must be unique.`,
            );
        }
        servers.forEach(toConnection);

        const parsed: AiChatRequest = parseOrThrow(
            AiChatRequestSchema,
            request ?? { messages: [] },
            "ERROR_INVALID_AI_CHAT_REQUEST",
            "The chat request is not valid",
        );
        const question: string = asText(prompt, "prompt", "ERROR_INVALID_AI_CHAT_REQUEST");
        const conversation: AiMessage[] = [
            ...parsed.messages.map(fromChatMessage),
            ...(question.length > 0
                ? [{ role: "human", content: [{ type: "text", text: question }] } as AiMessage]
                : []),
        ];
        if (conversation.length === 0) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_CHAT_REQUEST",
                "There is nothing to ask: the prompt is empty and the request carries no messages.",
            );
        }

        const started: number = Date.now();
        log.info(`running the agent "${definition.name}"`, {
            messages: conversation.length,
            tools: definition.tools.length,
            middleware: definition.middleware.length,
            output_schema: definition.outputSchema,
            system_prompt: definition.systemPrompt,
        });

        const agentRequest: AiAgentRequest = parseOrThrow(
            AiAgentRequestSchema,
            { messages: conversation },
            "ERROR_INVALID_AI_AGENT_REQUEST",
            "The agent request is not valid",
        );

        const flows: SubFlow[] = definition.tools.filter(isSubFlow);
        log.debug(`building the agent "${definition.name}"`, {
            mcp_servers: servers.map((server) => server.name),
            flow_tools: flows.length,
        });

        // The MCP connections stay open for as long as the agent may call a tool, so
        // closing them is the one thing that has to happen on every way out below.
        let mcpTools: ClientTool[] = [];
        let close: () => Promise<void> = async (): Promise<void> => undefined;
        if (servers.length > 0) {
            const client = new MultiServerMCPClient({
                mcpServers: Object.fromEntries(servers.map((server) => [server.name, toConnection(server)])),
            });
            close = (): Promise<void> => client.close();

            let discovered: ClientTool[];
            try {
                discovered = (await client.getTools()) as unknown as ClientTool[];
            } catch (error: unknown) {
                await client.close().catch(() => undefined);
                throw new RuntimeError(
                    "ERROR_LOADING_AI_MCP_TOOLS",
                    `Could not load tools from the configured MCP servers: ${describeError(error)}`,
                );
            }

            const allowed = new Set(servers.flatMap((server) => server.allowed_tools ?? []));
            mcpTools =
                allowed.size === 0
                    ? discovered
                    : discovered.filter((entry) => allowed.has(entry.name.split("__").pop() ?? entry.name));
        }

        let agent: ReactAgent;
        try {
            // Two sub flows may share a title, and the model needs to tell the tools
            // they become apart.
            const taken = new Set<string>();
            const agentTools: ClientTool[] = [
                ...flows.map((flow, index): ClientTool => {
                    const schema: Record<string, unknown> | undefined = toPlainSchema(flow.inputSchema);

                    // The name the caller gave the sub flow, turned into something a
                    // model will accept. The sub flow carries it itself; its schema
                    // `title` is the older place to put it and is still read. A sub
                    // flow that carries neither falls back to its position, so a
                    // nameless tool is still addressable.
                    //
                    // A sub flow is a callable, so `name` is only the caller's name
                    // when hercules defined it over the intrinsic `Function.name` -
                    // which it does enumerably. Read plainly, a sub flow the caller
                    // left unnamed would be advertised under whatever the wrapping
                    // function happens to be called, and the schema's title would
                    // never be reached.
                    const named: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(flow, "name");
                    const declared: unknown =
                        (named?.enumerable ? named.value : undefined) ?? schema?.title ?? schema?.name;
                    const cleaned: string =
                        typeof declared === "string"
                            ? declared.trim().replace(TOOL_NAME_ALLOWED, "_").replace(/^_+|_+$/g, "").slice(0, 64)
                            : "";
                    let toolName: string = cleaned.length > 0 ? cleaned : `tool_${index + 1}`;
                    if (taken.has(toolName)) {
                        let suffix = 2;
                        while (taken.has(`${toolName}_${suffix}`)) suffix += 1;
                        toolName = `${toolName}_${suffix}`;
                    }
                    taken.add(toolName);

                    const described: unknown = flow.description ?? schema?.description;
                    const description: string = typeof described === "string" ? described : "";
                    toolLog.debug(`the tool "${toolName}" is built from a flow`, {
                        declared,
                        description,
                        schema,
                    });

                    return tool(
                        (args: unknown) => {
                            const calledAt: number = Date.now();
                            toolLog.info(`the agent calls the tool "${toolName}" with`, args);

                            return Promise.resolve(flow(args as never)).then(
                                (result) => {
                                    toolLog.info(
                                        `the tool "${toolName}" answered after ${Date.now() - calledAt}ms with`,
                                        result,
                                    );
                                    return typeof result === "string" ? result : JSON.stringify(result ?? null);
                                },
                                (error: unknown) => {
                                    toolLog.error(`the tool "${toolName}" failed after ${Date.now() - calledAt}ms`, {
                                        error: describeError(error),
                                    });
                                    return `The tool failed: ${describeError(error)}`;
                                },
                            );
                        },
                        {
                            name: toolName,
                            description,
                            schema: (schema ?? emptyJsonSchema()) as never,
                        },
                    ) as unknown as ClientTool;
                }),
                ...mcpTools,
            ];
            log.debug(
                `the agent "${definition.name}" has ${agentTools.length} tools`,
                agentTools.map((entry) => (entry as { name?: string }).name),
            );

            agent = createAgent({
                model: new FlowChatModel({ run: definition.model }),
                tools: agentTools,
                middleware: definition.middleware.map(
                    (flow, index): AnyAgentMiddleware =>
                        createMiddleware({
                            name: `flow_middleware_${index + 1}`,
                            beforeModel: {
                                hook: createHookHandler(flow, definition.name, "before_model"),
                                canJumpTo: [...JUMP_TARGETS],
                            },
                            afterModel: {
                                hook: createHookHandler(flow, definition.name, "after_model"),
                                canJumpTo: [...JUMP_TARGETS],
                            },
                        } as never) as AnyAgentMiddleware,
                ),
                name: definition.name,
                ...(definition.systemPrompt ? { systemPrompt: definition.systemPrompt } : {}),
                // An output type is only asked for here when the agent has no tools
                // to offer. langchain sends the type and the tools in one request -
                // as a response format, or as an extract tool with the tool call
                // forced - and a provider may refuse that combination outright
                // ("tools is incompatible with response_format"). With tools bound
                // the type is asked for afterwards instead, in a turn of its own.
                ...(definition.outputSchema && agentTools.length === 0
                    ? { responseFormat: definition.outputSchema }
                    : {}),
            } as never) as unknown as ReactAgent;
        } catch (error: unknown) {
            log.error(`the agent "${definition.name}" could not be built`, { error: describeError(error) });
            await close().catch(() => undefined);
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError(
                "ERROR_BUILDING_AI_AGENT",
                `Could not build agent "${definition.name}": ${describeError(error)}`,
            );
        }

        let answer: AiAgentResponse;
        try {
            log.debug("the conversation the agent starts from", agentRequest.messages);
            const result = await agent.invoke({ messages: agentRequest.messages.map(toLangChainMessage) });

            // The run only ever produced what is in the conversation, so both what it
            // did and what it is waiting for are read back off it.
            const produced: AiMessage[] = (result.messages ?? []).map(toFlowMessage);

            // Every tool the agent called, with the arguments it used and what came
            // back. A chat completion carries one message, so without this the whole
            // middle of a run - the part that explains how the answer came about -
            // never leaves the node.
            const steps: AiAgentStep[] = [];
            for (const message of produced) {
                for (const block of message.content ?? []) {
                    if (block.type !== "tool_call" || typeof block.name !== "string") continue;

                    const id: unknown = block.id;
                    const answered: AiMessage | undefined = produced.find(
                        (entry) => entry.role === "tool" && entry.tool_call_id === id,
                    );
                    const text: string | undefined = answered ? textOf(answered) : undefined;
                    const failed: boolean = answered?.status === "error";

                    steps.push({
                        name: block.name,
                        ...(block.args && typeof block.args === "object"
                            ? { args: block.args as Record<string, unknown> }
                            : {}),
                        ...(text !== undefined && !failed ? { result: text } : {}),
                        ...(text !== undefined && failed ? { error: text } : {}),
                    });
                }
            }

            // What the answer is waiting for, read back off the question it asked: the
            // calls and the code they are answered with. A flow gets them as data -
            // enough to build buttons elsewhere - and the node needs to know nothing
            // about which tools a middleware guarded.
            const ending: AiMessage | undefined = produced.at(-1);
            const asked: string = ending ? textOf(ending) : "";
            const code: string | undefined = codeOf(asked);
            const pending: AiAgentApproval[] = [];
            if (code && !asked.includes(`${DECIDED} `)) {
                for (const line of asked.split("\n")) {
                    const described: string = line.trim();
                    if (!described.endsWith(")")) continue;

                    const call: string = described.slice(0, -1);
                    const opens: number = call.indexOf("(");
                    if (opens <= 0) continue;

                    let args: Record<string, unknown> | undefined;
                    try {
                        args = JSON.parse(call.slice(opens + 1)) as Record<string, unknown>;
                    } catch {
                        args = undefined;
                    }

                    pending.push({ name: call.slice(0, opens), ...(args ? { args } : {}), code });
                }
            }

            if (pending.length > 0) {
                log.info(`the agent "${definition.name}" is waiting for approval`, pending);
            }

            answer = parseOrThrow(
                AiAgentResponseSchema,
                {
                    messages: produced,
                    ...(result.structuredResponse ? { structured_response: result.structuredResponse } : {}),
                    ...(steps.length > 0 ? { steps } : {}),
                    ...(pending.length > 0 ? { awaiting_approval: pending } : {}),
                },
                "ERROR_INVALID_AI_AGENT_RESPONSE",
                "The agent did not answer with a valid agent response",
            );
            log.info(
                `the agent "${definition.name}" finished after ${Date.now() - started}ms with ${answer.messages.length} messages`,
                { structured_response: answer.structured_response },
            );
            log.debug("the conversation the agent ends with", answer.messages);

            // The second phase: the agent has finished working, so the type can now
            // be asked for on its own, with no tools in the request to collide with
            // it. This is the turn langchain cannot do for us - it ends its loop as
            // soon as the model answers without a tool call, and the type has to be
            // asked for in a request of its own.
            if (definition.outputSchema && !answer.structured_response) {
                const transcript: string = answer.messages
                    .map((message) => {
                        const said: string = textOf(message);
                        return said.length > 0 ? `${message.role}: ${said}` : "";
                    })
                    .filter((line) => line.length > 0)
                    .join("\n\n");

                log.debug(`asking the agent "${definition.name}" for the type on its own`, {
                    transcript: transcript.length,
                });

                const extractor = createAgent({
                    model: new FlowChatModel({ run: definition.model }),
                    tools: [],
                    responseFormat: definition.outputSchema,
                } as never) as unknown as ReactAgent;

                const extracted = await extractor.invoke({
                    messages: [
                        toLangChainMessage({
                            role: "human",
                            content: [{ type: "text", text: `${transcript}\n\n${EXTRACTION_PROMPT}` }],
                        }),
                    ],
                });

                if (extracted.structuredResponse) {
                    answer = { ...answer, structured_response: extracted.structuredResponse };
                    log.info(`the agent "${definition.name}" answered the type on the second turn`, {
                        structured_response: answer.structured_response,
                    });
                }
            }
        } catch (error: unknown) {
            log.error(`the agent "${definition.name}" failed after ${Date.now() - started}ms`, {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            throw error;
        } finally {
            await close().catch(() => undefined);
        }

        const last: AiMessage | undefined = answer.messages.at(-1);
        if (!last) {
            throw new RuntimeError("ERROR_INVALID_AI_AGENT_RESPONSE", "The agent answered with an empty conversation.");
        }

        // An agent asked for a type has to answer in it: without the structured answer
        // the node's return value would be missing the very field the flow reads. By
        // here the type has been asked for on its own as well, so this is a model
        // that would not answer in it either way.
        if (outputSchema && !answer.structured_response) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_AGENT_RESPONSE",
                `The agent "${definition.name}" did not answer in the type passed as "output_schema", not even when asked for it on its own.`,
            );
        }

        const response: AiChatResponse = toChatResponse(last, parsed.model ?? "", answer.structured_response, {
            ...(answer.steps ? { steps: answer.steps } : {}),
            ...(answer.awaiting_approval ? { awaitingApproval: answer.awaiting_approval } : {}),
        });
        log.info(`the agent "${definition.name}" answers the node with`, response);
        return response;
    }
}
