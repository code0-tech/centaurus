import {HerculesFunctionContext} from "@code0-tech/hercules";
import {Model} from "../types/aiModel";
import {Tool} from "../types/aiTool";
import {extractToolToken} from "../helpers";
import {ToolSet} from "ai";
import {ProviderV3} from "@ai-sdk/provider";
import {createGoogleGenerativeAI} from "@ai-sdk/google";
import {createOpenAI} from "@ai-sdk/openai";
import {createAnthropic} from "@ai-sdk/anthropic";
import {OllamaSettings, OllamaSettingsSchema} from "./models/ollama/ollamaSettings";
import {createOllama} from "ollama-ai-provider-v2";
import {createMCPClient} from "@ai-sdk/mcp";

export function buildProvider(model: Model, apiKey: string): ProviderV3 {
    switch (model.provider) {
        case "google": {
            return createGoogleGenerativeAI({
                apiKey: apiKey
            });
        }
        case "openai": {
            return createOpenAI({
                apiKey: apiKey
            })
            break
        }
        case "anthropic": {
            return createAnthropic({
                apiKey: apiKey
            })
        }
        case "ollama": {
            const settings: OllamaSettings = OllamaSettingsSchema.parse(model.settings)
            return createOllama({
                baseURL: settings.baseURL
            })
        }

    }
}

export async function buildTools(tools: Tool[], context: HerculesFunctionContext) {
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
    return modelTools;
}
