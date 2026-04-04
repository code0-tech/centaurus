import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../../../src/helpers";
import z from "zod";

export const AnthropicSettingsSchema = z.looseObject({

})

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_ANTHROPIC_SETTINGS", AnthropicSettingsSchema),
        identifier: "AI_ANTHROPIC_SETTINGS"
    })
}