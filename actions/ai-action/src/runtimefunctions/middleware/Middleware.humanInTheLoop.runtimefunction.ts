import {
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import type { AiContentBlock } from "../../datatypes/message/Message.contentBlock.datatype.js";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import { AiAgentStateSchema, type AiAgentState } from "../../datatypes/middleware/Middleware.agentState.datatype.js";
import { AiStateUpdateSchema, type AiStateUpdate } from "../../datatypes/middleware/Middleware.stateUpdate.datatype.js";
import type { AiMiddlewareTransform } from "../../datatypes/middleware/Middleware.transform.datatype.js";
import type { ApprovalDecision, OpenQuestion, ToolCall } from "../../types/middleware/Approval.types.js";
import { APPROVE, DECIDED, DECLINE } from "../../utils/middleware/Approval.markers.util.js";
import { asList } from "../../utils/shared/Shared.asList.util.js";
import { askFor } from "../../utils/middleware/Approval.askFor.util.js";
import { codeOf } from "../../utils/middleware/Approval.codeOf.util.js";
import { describeCall } from "../../utils/middleware/Approval.describeCall.util.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { newCode } from "../../utils/middleware/Approval.newCode.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";
import { settle } from "../../utils/middleware/Approval.settle.util.js";
import { textOf } from "../../utils/message/Message.textOf.util.js";

const log = logger("middleware");

@Identifier("ai::middleware::human_in_the_loop")
@DisplayIcon("tabler:message-ai")
@Signature("(tools: LIST<TEXT>): TRANSFORM<AI_AGENT_STATE, AI_STATE_UPDATE>")
@Name({ code: "en-US", content: "Human in the loop" })
@DisplayMessage({ code: "en-US", content: "Ask before running ${tools}" })
@ThrowsError()
@Parameter({
    runtimeName: "tools",
    name: [{ code: "en-US", content: "Tools" }],
    description: [
        {
            code: "en-US",
            content:
                "The tools the agent has to ask about before running them. Instead of running one, it answers with what it wants to do and ends the turn; the reply to that question - the next message of the conversation - decides.",
        },
    ],
})
export class HumanInTheLoopMiddlewareFunction {
    /**
     * A middleware that makes an agent ask before it runs certain tools, and holds it
     * to the answer.
     *
     * It is a middleware like any other, so an agent gets it the same way it gets a
     * trimmer or a flow of the project - the agent node itself knows nothing about
     * approvals.
     *
     * Asking happens by answering: the calls are held back and the turn ends with the
     * question, so the request a client is waiting on is finished and a person has all
     * the time they need. The reply arrives as the next message of the conversation -
     * a chat client has no other channel, and an OpenAI client resends the whole
     * conversation anyway.
     *
     * Whether it approved is decided by matching the question's code, never by the
     * agent asking again: a model that re-states a call a person refused gets nothing,
     * and so does one that re-states a call nobody answered. Each question is spent
     * once, so every call needs an approval of its own.
     */
    run(_context: FunctionContext, tools: unknown[]): AiMiddlewareTransform {
        const guarded: string[] = asList(tools, "tools").map((tool, index) =>
            requireText(
                tool,
                "ERROR_INVALID_AI_STATE_UPDATE",
                `Entry ${index + 1} of "tools" has to be the name of a tool to ask about.`,
            ),
        );
        if (guarded.length === 0) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_STATE_UPDATE",
                "Human in the loop needs at least one tool to ask about.",
            );
        }

        const names = new Set(guarded);

        return {
            name: `human_in_the_loop:${guarded.join(",")}`,
            description: `Asks before running ${guarded.join(", ")}`,
            inputSchema: AiAgentStateSchema,
            outputSchema: AiStateUpdateSchema,
            run: async (state: AiAgentState): Promise<AiStateUpdate> => {
                const parsed: AiAgentState = parseOrThrow(
                    AiAgentStateSchema,
                    state,
                    "ERROR_INVALID_AI_AGENT_STATE",
                    "The agent state is not valid",
                );

                // Only the phase after the model has tool calls to hold back.
                if (parsed.hook !== "after_model") return {};

                const last: AiMessage | undefined = parsed.messages.at(-1);
                if (!last || last.role !== "ai") return {};

                // The tool calls the message asks for, with the arguments the model
                // chose, narrowed to the ones this middleware guards.
                const held: ToolCall[] = [];
                const declined: ToolCall[] = [];
                const approved: ToolCall[] = [];
                const calls: ToolCall[] = (last.content ?? [])
                    .filter(
                        (block): block is AiContentBlock & { name: string } =>
                            block.type === "tool_call" && typeof block.name === "string",
                    )
                    .map((block) => ({ name: block.name, args: (block.args ?? {}) as Record<string, unknown> }))
                    .filter((call) => names.has(call.name));
                if (calls.length === 0) return {};

                const earlier: AiMessage[] = parsed.messages.slice(0, -1);
                // Spent questions are rewritten in place, so one answer cannot serve
                // two calls.
                const settled = new Map<number, AiMessage>();
                let open: string | undefined;
                let declinedCode: string | undefined;

                for (const call of calls) {
                    // The newest question about this call that has not been spent. A
                    // spent question carries DECIDED and is skipped, so an approval is
                    // used for the one call it was given for - the next call of the
                    // same tool, with the same arguments, has to be asked about again.
                    const needle: string = describeCall(call);
                    let question: OpenQuestion | undefined;

                    for (let at = earlier.length - 1; at >= 0 && !question; at -= 1) {
                        const message: AiMessage = earlier[at];
                        if (message.role !== "ai") continue;

                        const text: string = textOf(message);
                        if (!text.includes(needle) || text.includes(`${DECIDED} `)) continue;

                        const code: string | undefined = codeOf(text);
                        if (!code) continue;

                        // What the person answered, matched rather than understood.
                        // Only "APPROVE <code>" of this very question approves, and
                        // only "DECLINE <code>" refuses; everything else leaves it
                        // open, a plain "yes" included. No wording, no language and no
                        // model decides here. An answer releases the run that directly
                        // follows it and nothing later: once the agent has spoken
                        // again, the approval is spent - which is what makes it
                        // single-use without anything being stored.
                        const wanted: string = code.toUpperCase();
                        let decision: ApprovalDecision = "open";

                        for (const reply of earlier.slice(at + 1)) {
                            if (reply.role === "human") {
                                const said: string = textOf(reply).toUpperCase();
                                if (decision === "open" && said.includes(`${DECLINE} ${wanted}`)) decision = "declined";
                                else if (decision === "open" && said.includes(`${APPROVE} ${wanted}`))
                                    decision = "approved";
                                continue;
                            }

                            if (reply.role === "ai" && decision !== "open") {
                                decision = "spent";
                                break;
                            }
                        }

                        question = { at, text, code, decision };
                    }

                    if (!question) {
                        held.push(call);
                        continue;
                    }

                    switch (question.decision) {
                        case "approved":
                            settled.set(question.at, settle(earlier[question.at], question.code));
                            approved.push(call);
                            break;
                        case "declined":
                            settled.set(question.at, settle(earlier[question.at], question.code));
                            declined.push(call);
                            declinedCode ??= question.code;
                            break;
                        case "open":
                            // The question stands; its code is still the one that
                            // decides, so it is repeated rather than replaced.
                            held.push(call);
                            open ??= question.code;
                            break;
                        case "spent":
                            log.debug("an earlier approval was already spent, so this call is asked about again", {
                                call: describeCall(call),
                                code: question.code,
                            });
                            held.push(call);
                            break;
                    }
                }

                if (settled.size === 0 && held.length === 0) return {};
                const history: AiMessage[] = earlier.map((message, at) => settled.get(at) ?? message);

                // Anything undecided ends the turn with the question - running half of
                // what the model wanted while asking about the rest would be a
                // decision nobody made.
                if (held.length > 0) {
                    const code: string = open ?? newCode();
                    log.info(`the agent asks before it runs (${code})`, held.map(describeCall));
                    return {
                        messages: [
                            ...history,
                            {
                                role: "ai",
                                content: [{ type: "text", text: askFor(held, code) }],
                                ...(last.id ? { id: last.id } : {}),
                            },
                        ],
                        jump_to: "end",
                    };
                }

                if (declined.length > 0) {
                    log.info("the agent does not run what was declined", declined.map(describeCall));
                    return {
                        messages: [
                            ...history,
                            {
                                role: "ai",
                                content: [
                                    {
                                        type: "text",
                                        text: [
                                            `${DECLINE} ${declinedCode ?? newCode()}`,
                                            ...declined.map(describeCall),
                                        ].join("\n"),
                                    },
                                ],
                                ...(last.id ? { id: last.id } : {}),
                            },
                        ],
                        jump_to: "end",
                    };
                }

                // Everything was approved: the calls stay as the model made them, and
                // only the questions behind them are marked as spent.
                log.info("the agent runs what was approved", approved.map(describeCall));
                return { messages: [...history, last] };
            },
        };
    }
}
