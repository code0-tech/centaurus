import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../../../src/helpers";
import z from "zod";

export const OpenAiSettingsSchema = z.looseObject({

})

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_OPENAI_SETTINGS", OpenAiSettingsSchema),
        identifier: "AI_OPENAI_SETTINGS"
    })
}