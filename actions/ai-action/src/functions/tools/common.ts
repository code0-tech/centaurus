import {ActionSdk} from "@code0-tech/hercules";
import {TOOL_REGISTRY, ToolProvider} from "../../types/aiTool";


export default (sdk: ActionSdk, tool: ToolProvider) => {
    return sdk.registerFunctionDefinitions({
        runtimeName: tool,
        runtimeDefinitionName: "createTool",
        linkedDataTypes: ["AI_TOOL"],
        signature: `(name: string, url: string, tools?: ${TOOL_REGISTRY[tool].tools.map(toolName => `"${toolName}"`).join(" | ")}): AI_TOOL`,
        parameters: [
            {
                runtimeName: "name",
                hidden: true,
                defaultValue: tool
            },
            {
                runtimeName: "url",
                hidden: true,
                defaultValue: TOOL_REGISTRY[tool].url
            },
            {
                runtimeName: "tools",
                hidden: false,
                optional: false,
                defaultValue: TOOL_REGISTRY[tool].tools
            }
        ]

    })
}