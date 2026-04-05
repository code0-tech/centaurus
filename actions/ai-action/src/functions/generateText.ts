import {ActionSdk, HerculesFunctionContext} from "@code0-tech/hercules";
import {Model} from "../types/aiModel";
import {extractToken, extractToolToken} from "../helpers";
import {generateText, isLoopFinished, ToolSet} from "ai";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {ProviderV3} from "@ai-sdk/provider";
import {createOpenAI} from "@ai-sdk/openai";
import {createAnthropic} from "@ai-sdk/anthropic";
import {createOllama} from "ollama-ai-provider-v2";
import {OllamaSettings, OllamaSettingsSchema} from "./models/ollama/ollamaSettings";
import {createMCPClient} from "@ai-sdk/mcp";
import {Tool} from "../types/aiTool";


export const handler = async (context: HerculesFunctionContext, model: Model, system: string, prompt: string, tools: Tool[]): Promise<string> => {
    const apiKey = extractToken(context, model.provider)

    let provider: ProviderV3

    switch (model.provider) {
        case "google": {
            provider = createGoogleGenerativeAI({apiKey: apiKey});
            break
        }
        case "openai": {
            provider = createOpenAI({
                apiKey: apiKey
            })
            break
        }
        case "anthropic": {
            provider = createAnthropic({
                apiKey: apiKey
            })
            break
        }
        case "ollama": {
            const settings: OllamaSettings = OllamaSettingsSchema.parse(model.settings)
            provider = createOllama({
                baseURL: settings.baseURL
            })
            break
        }

    }
    let modelTools: ToolSet = {}

    for (const tool of tools) {
        const mcpClient = await createMCPClient({
            transport: {
                type: 'http',
                url: tool.url,
                headers: {Authorization: `Bearer ${extractToolToken(context, tool.providerName)}`},
                redirect: 'error',
            },
        });
        const tools = await mcpClient.tools()

        if (!tool.tools) {
            modelTools = {
                ...modelTools,
                ...tools
            }
            continue
        }

        const filteredTools: ToolSet = {}

        Object.entries(tools)
            .filter(([toolName]) => tool.tools.includes(toolName))
            .forEach(([toolName, toolValue]) => {
                filteredTools[toolName] = toolValue
            })


        modelTools = {
            ...modelTools,
            ...filteredTools
        }
    }

    const generated = await generateText({
        model: provider.languageModel(model.model),
        prompt: prompt,
        system: system,
        tools: modelTools,
        stopWhen: isLoopFinished(),
    })


    if (generated.output) {
        return generated.output
    }
    generated.content.forEach((value: any) => {
        if (value.type === "tool-result" && value.output.content) {
            return value.output.content[0].text
        }
    })

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