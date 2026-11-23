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
import { FlowChatModel } from "../../model/Model.flowChatModel.js";
import { asSubFlow } from "../../utils/shared/Shared.asSubFlow.util.js";
import { asText } from "../../utils/shared/Shared.asText.util.js";
import { describeError } from "../../utils/shared/Shared.describeError.util.js";
import { requireText } from "../../utils/shared/Shared.requireText.util.js";
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
    "<T extends TYPE>(text: TEXT, information: T, model: TRANSFORM<AI_MODEL_REQUEST, AI_MODEL_RESPONSE>, instructions?: TEXT): T",
)
@Name({ code: "en-US", content: "Read information from text" })
@Alias({ code: "en-US", content: "extract;extraction;information;read;parse;fields;structured;ai;llm" })
@Description({
    code: "en-US",
    content:
        "Reads a text and fills the fields of a data type with what it says - names, dates, amounts - so the flow can work with them instead of searching the text itself.",
})
@DisplayMessage({ code: "en-US", content: "Read ${information} out of ${text}" })
@ThrowsError()
@Parameter({
    runtimeName: "text",
    name: [{ code: "en-US", content: "Text" }],
    description: [
        {
            code: "en-US",
            content:
                "The text that is read: an email, a message, a document, anything the flow has as text. Only what stands in it ends up in the fields.",
        },
    ],
})
@Parameter({
    runtimeName: "information",
    name: [{ code: "en-US", content: "Information" }],
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
export class ExtractInformationFunction {
    /**
     * One model call with the type forced on the answer, and no tools: there is
     * nothing for a model to decide here beyond what the text says, so this is the
     * agent node without its loop. Which way the type reaches the provider - as a
     * response format or as a forced tool call - is {@link FlowChatModel}'s business,
     * decided from what the model node declared it can do.
     *
     * The parameters read as the sentence the node is: this text, this information,
     * read by this model.
     */
    async run(
        _context: FunctionContext,
        text: string,
        information: unknown,
        model: unknown,
        instructions?: string,
    ): Promise<Record<string, unknown>> {
        const read: string = requireText(
            text,
            "ERROR_INVALID_AI_EXTRACTION",
            'There is nothing to read: the "text" parameter is empty.',
        );
        const added: string = asText(instructions ?? "", "instructions", "ERROR_INVALID_AI_EXTRACTION");

        // The "information" parameter is a TYPE, so it arrives as that type's JSON
        // schema - as a protobuf Struct when aquila wrapped it, which `toPlainSchema`
        // unwraps either way. A structured answer has to be an object to come back as
        // a data type's value, so anything else is rejected here rather than deep
        // inside the model call.
        const schema: Record<string, unknown> | undefined = toPlainSchema(information);
        if (!schema || typeof schema !== "object") {
            throw new RuntimeError(
                "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                `The "information" parameter has to be a type, but a ${typeof information} was passed.`,
            );
        }
        if (!("properties" in schema)) {
            throw new RuntimeError(
                "ERROR_INVALID_AI_OUTPUT_SCHEMA",
                'The text can only be read into a type with fields: the type passed as "information" has none.',
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

        const result = await extractor.invoke({
            messages: [toLangChainMessage({ role: "human", content: [{ type: "text", text: read }] })],
        });
        const answer: unknown = result.structuredResponse;

        // Without the structured answer the node's return value would be missing the
        // very fields the flow reads, so a model that would not answer in the type
        // fails the node instead of handing back an empty value.
        if (!answer || typeof answer !== "object") {
            throw new RuntimeError(
                "ERROR_FAILED_AI_EXTRACTION",
                'The model did not answer in the type passed as "information".',
            );
        }

        return answer as Record<string, unknown>;
    }
}
