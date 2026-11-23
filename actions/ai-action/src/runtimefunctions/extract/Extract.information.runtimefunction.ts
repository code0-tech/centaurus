import {
    Alias,
    Description,
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
import { createAgent, type ReactAgent } from "langchain";
import { AiChatRequestSchema, type AiChatRequest } from "../../datatypes/chat/Chat.request.datatype.js";
import type { AiMessage } from "../../datatypes/message/Message.datatype.js";
import { FlowChatModel } from "../../model/Model.flowChatModel.js";
import { asSubFlow } from "../../utils/shared/Shared.asSubFlow.util.js";
import { asText } from "../../utils/shared/Shared.asText.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { fromChatMessage } from "../../utils/chat/Chat.fromChatMessage.util.js";
import { parseOrThrow } from "../../utils/shared/Shared.parseOrThrow.util.js";
import { toLangChainMessage } from "../../utils/message/Message.toLangChainMessage.util.js";
import { toPlainSchema } from "../../utils/shared/Shared.toPlainSchema.util.js";

/**
 * What the model is told before the text, ahead of whatever the flow adds.
 *
 * The type itself already says which fields are wanted and which of them may be
 * left out, so this only has to settle what the model is not to do: invent what
 * the text does not say, and answer in anything but the type.
 */
const EXTRACTION_PROMPT =
    "Read the text the user sends and answer with what it says, in the type you were given. Take nothing from outside the text, and leave a field out rather than guessing at it.";

@Identifier("ai::extract::information")
@DisplayIcon("tabler:ai")
@Signature(
    "<T extends TYPE>(prompt: TEXT, answer_type: T, model: TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>, instructions?: TEXT, conversation?: AI_CHAT_REQUEST): T",
)
@Name({ code: "en-US", content: "Read information from text" })
@Alias({ code: "en-US", content: "extract;extraction;information;read;parse;fields;structured;ai;llm" })
@Description({
    code: "en-US",
    content:
        "Reads a text and fills the fields of a data type with what it says - names, dates, amounts - so the flow can work with them instead of searching the text itself.",
})
@DisplayMessage({ code: "en-US", content: "Read ${answer_type} out of ${prompt}" })
@ThrowsError()
@Parameter({
    runtimeName: "prompt",
    name: [{ code: "en-US", content: "Prompt" }],
    description: [
        {
            code: "en-US",
            content:
                "The text that is read: an email, a message, a document, anything the flow has as text. Only what stands in it ends up in the fields.",
        },
    ],
})
@Parameter({
    runtimeName: "answer_type",
    name: [{ code: "en-US", content: "Answer type" }],
    description: [
        {
            code: "en-US",
            content:
                "The data type whose fields are filled from the text. It needs fields; make a field optional when the text may not say it, because a missing one is then simply left empty.",
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
                "The model that reads the text, built by one of the model nodes. The model decides which provider is called and on what key.",
        },
    ],
})
@Parameter({
    runtimeName: "instructions",
    name: [{ code: "en-US", content: "Instructions" }],
    description: [
        {
            code: "en-US",
            content:
                "How the text is to be read, if it needs saying: which date format to use, which currency amounts are in, which language to answer in, what to do with several candidates.",
        },
    ],
    optional: true,
})
@Parameter({
    runtimeName: "conversation",
    name: [{ code: "en-US", content: "Conversation" }],
    description: [
        {
            code: "en-US",
            content:
                "Everything that was said before, as a chat client sends it. Those messages go ahead of the prompt, so the fields are read out of the whole conversation and not just one text.",
        },
    ],
    optional: true,
})
export class ExtractInformationFunction {
    /**
     * One model call with the type forced on the answer, and no tools: there is
     * nothing for a model to decide here beyond what the text says, so this is the
     * agent node without its loop. Which way the type reaches the provider - as a
     * response format or as a forced tool call - is {@link FlowChatModel}'s business,
     * decided from what the model node declared it can do.
     *
     * The parameters read as the sentence the node is: this prompt, read into this
     * answer type by this model.
     */
    async run(
        _context: FunctionContext,
        prompt: string,
        answer_type: unknown,
        model: unknown,
        instructions?: string,
        conversation?: AiChatRequest,
    ): Promise<Record<string, unknown>> {
        const read: string = asText(prompt, "prompt", "ERROR_INVALID_AI_EXTRACTION").trim();
        const added: string = asText(instructions ?? "", "instructions", "ERROR_INVALID_AI_EXTRACTION");

        // What was said before comes ahead of the prompt, which is how a chat endpoint
        // hands this node the conversation the fields are read out of. The prompt may
        // then be empty, as long as the conversation carries something to read.
        const parsed: AiChatRequest = parseOrThrow(
            AiChatRequestSchema,
            conversation ?? { messages: [] },
            "ERROR_INVALID_AI_CHAT_REQUEST",
            "The chat request is not valid",
        );
        const history: AiMessage[] = [
            ...parsed.messages.map(fromChatMessage),
            ...(read.length > 0 ? [{ role: "human", content: [{ type: "text", text: read }] } as AiMessage] : []),
        ];
        if (history.length === 0) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_EXTRACTION",
                "There is nothing to read: the prompt is empty and the conversation carries no messages.",
            );
        }

        // The "answer_type" parameter is a TYPE, so it arrives as that type's JSON
        // schema - as a protobuf Struct when aquila wrapped it, which `toPlainSchema`
        // unwraps either way. A structured answer has to be an object to come back as
        // a data type's value, so anything else is rejected here rather than deep
        // inside the model call.
        const schema: Record<string, unknown> | undefined = toPlainSchema(answer_type);
        if (!schema || typeof schema !== "object") {
            throw new RuntimeError(
                "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                `The "answer_type" parameter has to be a type, but a ${typeof answer_type} was passed.`,
            );
        }
        if (!("properties" in schema)) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                'The text can only be read into a type with fields: the type passed as "answer_type" has none.',
            );
        }

        let extractor: ReactAgent;
        try {
            extractor = createAgent({
                model: new FlowChatModel({ run: asSubFlow(model, "model") }),
                tools: [],
                responseFormat: schema,
                systemPrompt: added.length > 0 ? `${EXTRACTION_PROMPT}\n\n${added}` : EXTRACTION_PROMPT,
            } as never) as unknown as ReactAgent;
        } catch (error: unknown) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError(
                "ERROR_BUILDING_AI_EXTRACTION",
                `Could not build the extraction: ${describeError(error)}`,
            );
        }

        const result = await extractor.invoke({ messages: history.map(toLangChainMessage) });
        const answer: unknown = result.structuredResponse;

        // Without the structured answer the node's return value would be missing the
        // very fields the flow reads, so a model that would not answer in the type
        // fails the node instead of handing back an empty value.
        if (!answer || typeof answer !== "object") {
            throw new RuntimeError(
                "ERROR_FAILED_AI_EXTRACTION",
                'The model did not answer in the type passed as "answer_type".',
            );
        }

        return answer as Record<string, unknown>;
    }
}
