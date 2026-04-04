import {ActionSdk} from "@code0-tech/hercules";
import {z} from "zod";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers"
import {ModelSchema} from "../types/aiModel";

const providers = ModelSchema.shape.provider.options;

export const AuthTokensConfigSchema = z.object(
    Object.fromEntries(
        providers.map((option) => [
            option,
            z.object({
                defaultToken: z.string(),
                overrides: z.record(z.string(), z.string())
            })
        ])
    )
);

export type AuthTokensConfig = z.infer<typeof AuthTokensConfigSchema>

export default (sdk: ActionSdk) => {
    sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_CONFIG_AUTH_TOKENS_TYPE", AuthTokensConfigSchema),
        identifier: "AI_CONFIG_AUTH_TOKENS_TYPE"
    })

    return sdk.registerConfigDefinitions({
        type: "AI_CONFIG_AUTH_TOKENS_TYPE",
        identifier: "AUTH_TOKENS",
        linkedDataTypes: ["AI_CONFIG_AUTH_TOKENS_TYPE"],
        name: [
            {
                code: "en-US",
                content: "Auth tokens"
            }
        ],
        description: [
            {
                code: "en-US",
                content: "Every configured "
            }
        ]
    })
}