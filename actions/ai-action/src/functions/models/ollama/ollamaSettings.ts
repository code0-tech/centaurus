import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../../../src/helpers";
import z from "zod";

export const OllamaSettingsSchema = z.looseObject({
    baseURL: z.string()
})

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_OLLAMA_SETTINGS", OllamaSettingsSchema),
        identifier: "AI_OLLAMA_SETTINGS"
    })
}