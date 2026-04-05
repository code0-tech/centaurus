import {ActionSdk} from "@code0-tech/hercules";
import {Tool, ToolProvider} from "../../types/aiTool";


export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitions({
        definition: {
            runtimeName: "createTool",
            linkedDataTypes: ["AI_TOOL"],
            signature: "(providerName: string, url: string, tools?: string[]): AI_TOOL",
            parameters: [
                {
                    runtimeName: "providerName"
                },
                {
                    runtimeName: "url",
                },
                {
                    runtimeName: "tools",
                    optional: true
                },
            ],
        },
        handler: (
            providerName: string,
            url: string,
            tools?: string[]
        ): Tool => {
            return {
                providerName: providerName as ToolProvider,
                url: url,
                tools: tools || undefined
            }
        }
    })
}