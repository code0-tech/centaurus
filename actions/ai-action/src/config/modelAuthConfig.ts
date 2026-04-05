import {ActionSdk} from "@code0-tech/hercules";
import {z} from "zod";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers"
import {ModelSchema} from "../types/aiModel";

const providers = ModelSchema.shape.provider.options;

export const ModelAuthConfigSchema = z.object(
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
        type: singleZodSchemaToTypescriptDef("AI_MODEL_AUTH_CONFIG", ModelAuthConfigSchema),
        identifier: "AI_MODEL_AUTH_CONFIG"
    })

    return sdk.registerConfigDefinitions({
        type: "AI_MODEL_AUTH_CONFIG",
        identifier: "MODEL_AUTH",
        linkedDataTypes: ["AI_MODEL_AUTH_CONFIG"],
        name: [
            {
                code: "en-US",
                content: "Model auth"
            }
        ]
    })
}