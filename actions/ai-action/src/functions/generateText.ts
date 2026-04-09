import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {Model} from "../types/aiModel";
import {extractToken} from "../helpers";
import {generateText, isLoopFinished} from "ai";
import {Tool} from "../types/aiTool";
import {buildProvider, buildTools} from "./helpers";


export const handler = async (context: HerculesFunctionContext, model: Model, system: string, prompt: string, tools: Tool[]): Promise<string> => {
    const apiKey = extractToken(context, model.provider)

    const provider = buildProvider(model, apiKey);

    const modelTools = await buildTools(tools, context);

    const generated = await generateText({
        model: provider.languageModel(model.model),
        prompt: prompt,
        system: system,
        tools: modelTools,
        stopWhen: isLoopFinished(),
    })

    return generated.output
};

export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitionsAndFunctionDefinitions(
        {
            definition: {
                runtimeName: "generateText",
                signature: "(model: AI_MODEL, system: string, prompt: string, tools: AI_TOOL[]): string",
                linkedDataTypes: ["AI_MODEL", "AI_TOOL"]
            },
            handler: handler
        }
    )
}