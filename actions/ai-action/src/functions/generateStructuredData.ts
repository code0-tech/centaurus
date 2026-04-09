import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {Model} from "../types/aiModel";
import {Tool} from "../types/aiTool";
import {extractToken} from "../helpers";
import {generateText, isLoopFinished, Output} from "ai";
import {PlainValue} from "@code0-tech/tucana/helpers";
import {buildProvider, buildTools} from "./helpers";
import z from "zod";


function generateZodSchema(value: PlainValue): z.ZodTypeAny {
    if (value === null) {
        return z.null();
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return z.array(z.unknown());
        }

        const itemSchemas = value.map((item) => generateZodSchema(item));
        const itemSchema =
            itemSchemas.length === 1
                ? itemSchemas[0]
                : itemSchemas.slice(1).reduce((acc, current) => z.union([acc, current]), itemSchemas[0]);

        return z.array(itemSchema);
    }

    switch (typeof value) {
        case "string":
            return z.string();
        case "number":
            return z.number();
        case "boolean":
            return z.boolean();
        case "object": {
            const shape: Record<string, z.ZodTypeAny> = {};
            for (const [key, nestedValue] of Object.entries(value as Record<string, PlainValue>)) {
                shape[key] = generateZodSchema(nestedValue);
            }
            return z.object(shape);
        }
        default:
            return z.unknown();
    }
}

export const handler = async (context: HerculesFunctionContext, model: Model, system: string, prompt: string, tools: Tool[], type: PlainValue): Promise<PlainValue> => {
    const apiKey = extractToken(context, model.provider)

    const provider = buildProvider(model, apiKey);

    const modelTools = await buildTools(tools, context);

    const generated = await generateText({
        model: provider.languageModel(model.model),
        prompt: prompt,
        system: system,
        tools: modelTools,
        stopWhen: isLoopFinished(),
        output: Output.object({
            schema: generateZodSchema(type)
        })
    })

    return generated.output as any
};
export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitionsAndFunctionDefinitions(
        {
            definition: {
                runtimeName: "generateStructuredData",
                signature: "(model: AI_MODEL, system: string, prompt: string, tools: AI_TOOL[], type: TYPE): TYPE",
                linkedDataTypes: ["AI_MODEL", "AI_TOOL", "TYPE"],
                name: [
                    {
                        code: "en-US",
                        content: "Generate structured Data"
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "generate structured Data"
                    }
                ],
                parameters: [
                    {
                        runtimeName: "model",
                        name: [
                            {
                                code: "en-US",
                                content: "Model"
                            }
                        ],
                    },
                    {
                        runtimeName: "system",
                        name: [
                            {
                                code: "en-US",
                                content: "System prompt"
                            }
                        ]
                    },
                    {
                        runtimeName: "prompt",
                        name: [
                            {
                                code: "en-US",
                                content: "Prompt"
                            }
                        ]
                    },
                    {
                        runtimeName: "tools",
                        name: [
                            {
                                code: "en-US",
                                content: "Tools"
                            }
                        ]
                    },
                    {
                        runtimeName: "type",
                        name: [
                            {
                                code: "en-US",
                                content: "Output Type"
                            }
                        ]
                    }
                ]
            },
            handler: handler
        }
    )
}
