import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../../../src/helpers";
import z from "zod";

export const AnthropicSettingsSchema = z.looseObject({

})

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("ANTHROPIC_SETTINGS", AnthropicSettingsSchema),
        identifier: "ANTHROPIC_SETTINGS"
    })
}