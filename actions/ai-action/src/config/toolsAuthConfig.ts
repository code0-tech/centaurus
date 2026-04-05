import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers";
import {z} from "zod";
import {ToolProviderEnum} from "../types/aiTool";

const providers = ToolProviderEnum.options;

export const ToolsAuthConfigSchema = z.object(
    Object.fromEntries(
        providers.map((option) => [
            option,
            z.object({
                authToken: z.string(),
            })
        ])
    )
);

export default (sdk: ActionSdk) => {
    sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_TOOLS_AUTH_CONFIG", ToolsAuthConfigSchema),
        identifier: "AI_TOOLS_AUTH_CONFIG"
    })

    return sdk.registerConfigDefinitions({
        type: "AI_TOOLS_AUTH_CONFIG",
        identifier: "TOOLS_AUTH",
        linkedDataTypes: ["AI_TOOLS_AUTH_CONFIG"],
        name: [
            {
                code: "en-US",
                content: "Model auth"
            }
        ]
    })
}