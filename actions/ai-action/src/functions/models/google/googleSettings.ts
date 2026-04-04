import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../../../src/helpers";
import z from "zod";

export const GoogleSettingsSchema = z.looseObject({
    thinkingConfig: z.object({
        thinkingBudget: z.number().optional(),
        includeThoughts: z.boolean().optional(),
        thinkingLevel: z.enum(["minimal", "low", "medium", "high"]).optional()
    }).optional()
})

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes({
        type: singleZodSchemaToTypescriptDef("AI_GOOGLE_SETTINGS", GoogleSettingsSchema),
        identifier: "AI_GOOGLE_SETTINGS"
    })
}