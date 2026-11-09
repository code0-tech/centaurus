import {
    Description,
    DisplayIcon,
    DisplayMessage,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    Signature,
    ThrowsError,
} from "@code0-tech/hercules";
import type { AiAgentStep } from "../../datatypes/agent/Agent.step.datatype.js";
import { AiChatResponseSchema, type AiChatResponse } from "../../datatypes/chat/Chat.response.datatype.js";
import { logger } from "../../utils/shared/Log.logger.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";

/** Open WebUI reads these blocks out of the answer's text, so they have to survive as markup. */
const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

/** Text as it can stand inside an attribute. */
const escaped = (text: string): string => text.replace(/[&<>"]/g, (character) => ESCAPES[character] ?? character);

/** A value as an attribute Open WebUI can read back, which is its JSON, escaped. */
const asAttribute = (value: unknown): string => escaped(JSON.stringify(value ?? null));

/** Already-formatted text, which must not be wrapped a second time. */
const FORMATTED = /<details type="(reasoning|tool_calls)"/;

@Identifier("ai::openai::openwebui_formatting")
@DisplayIcon("thesvg:openwebui")
@Signature("(response: AI_CHAT_RESPONSE): AI_CHAT_RESPONSE")
@Name({ code: "en-US", content: "Format for Open WebUI" })
@Description({
    code: "en-US",
    content:
        "Rewrites an agent's answer so Open WebUI shows it the way it was meant: the steps on the way become collapsible blocks. Put it between the agent and \"Respond to the OpenAI request\".",
})
@DisplayMessage({ code: "en-US", content: "Format ${response} for Open WebUI" })
@ThrowsError()
@Parameter({
    runtimeName: "response",
    name: [{ code: "en-US", content: "Response" }],
    description: [
        {
            code: "en-US",
            content: "The answer to format, e.g. the one an agent produced, before it is sent to the client.",
        },
    ],
})
export class OpenAiOpenWebUiFormattingFunction {
    /**
     * Writes what the agent thought and which tools it used into the answer's text, in
     * the markup Open WebUI renders as collapsible blocks.
     *
     * An answer already carries both - `reasoning` and `steps` - but as fields of ours
     * next to the chat completion, and a client only reads the fields OpenAI defined,
     * so to Open WebUI an agent that called five tools looks exactly like one that
     * answered straight away. Open WebUI does read `<details type="reasoning">` and
     * `<details type="tool_calls">` out of the text, which is what this node puts
     * there: the same information, in the one place the client looks.
     *
     * The node sits between the agent and ${ai::openai::respond}, and only changes the
     * text - the fields stay as they are, so a flow that reads them after this node
     * still gets the data rather than the markup. An answer with nothing to show, and
     * one that came through here already, are returned untouched.
     */
    run(context: FunctionContext, response: unknown): AiChatResponse {
        const log = logger("openai", context.executionId);
        const answer: AiChatResponse = parseOrThrow(
            AiChatResponseSchema,
            response,
            "ERROR_INVALID_AI_OPENAI_RESPONSE",
            "The answer to format for Open WebUI has to be a chat response",
        );

        const steps: AiAgentStep[] = answer.steps ?? [];
        const thought: string = answer.reasoning?.trim() ?? "";
        if (thought.length === 0 && steps.length === 0) return answer;

        if (FORMATTED.test(answer.response)) {
            log.debug("this answer was already formatted for Open WebUI, so it is left as it is");
            return answer;
        }

        const blocks: string[] = [];

        // Reasoning is shown as what the model said to itself, which Open WebUI renders
        // as a quote under the summary - so every line of it is quoted.
        if (thought.length > 0) {
            const quoted: string = thought
                .split("\n")
                .map((line) => `> ${line}`)
                .join("\n");
            blocks.push(`<details type="reasoning" done="true">\n<summary>Thought</summary>\n${quoted}\n</details>`);
        }

        // One block per tool the agent used. A call that failed has its error where the
        // result would be: the block is what happened, and nothing happening is worse
        // to look at than a failure.
        steps.forEach((step, index) => {
            const result: unknown = step.error !== undefined ? step.error : (step.result ?? "");
            const summary: string = step.error !== undefined ? "Tool Failed" : "Tool Executed";

            blocks.push(
                `<details type="tool_calls" done="true" id="${index}" name="${escaped(step.name)}" ` +
                    `arguments="${asAttribute(step.args ?? {})}" result="${asAttribute(result)}">\n` +
                    `<summary>${summary}</summary>\n</details>`,
            );
        });

        const content: string = [...blocks, answer.response].filter((part) => part.length > 0).join("\n");
        log.info("formatted the answer for Open WebUI", { reasoning: thought.length > 0, steps: steps.length });

        return {
            ...answer,
            response: content,
            // Only the first choice is the answer - the node produces one, and a client
            // reading `choices` has to see the same text the streaming path sends.
            choices: answer.choices.map((choice, index) =>
                index === 0 ? { ...choice, message: { ...choice.message, content } } : choice,
            ),
        };
    }
}
