import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../../../src/helpers";
import {z} from "zod";

export const ReturnLabelsSchema = z.object({
    TemplateSet: z.enum([
        "NONE", "D_200", "PF_4_I", "PF_4_I_200", "PF_4_I_300", "PF_8_D_200", "T_200_BF", "T_300_BF", "ZPL_200", "ZPL_200_TRACKID_EAN_128", "ZPL_200_TRACKID_CODE_39", "ZPL_200_REFNO_EAN_128", "ZPL_200_REFNO_CODE_39", "ZPL_300", "ZPL_300_TRACKID_EAN_128", "ZPL_300_TRACKID_CODE_39", "ZPL_300_REFNO_EAN_128", "ZPL_300_REFNO_CODE_39"
    ]),
    LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"])
})

export const PrintingOptionsSchema = z.object({
    ReturnLabels: ReturnLabelsSchema.optional(),
    useDefault: z.string().max(7).optional(),
    DefinePrinter: z.object({
        LabelPrinter: z.string().max(255).optional(),
        DocumentPrinter: z.string().max(255).optional(),
    }).optional(),
})
export type PrintingOptions = z.infer<typeof PrintingOptionsSchema>
export type ReturnLabels = z.infer<typeof ReturnLabelsSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "RETURN_LABELS",
            type: singleZodSchemaToTypescriptDef("RETURN_LABELS",
                ReturnLabelsSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Return Labels"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Return Labels"
                }
            ]
        },
        {
            identifier: "GLS_PRINTING_OPTIONS",
            type: zodSchemaToTypescriptDefs(
                "GLS_PRINTING_OPTIONS",
                PrintingOptionsSchema,
                {
                    RETURN_LABELS: ReturnLabelsSchema
                }
            ).get("GLS_PRINTING_OPTIONS")!,
            name: [
                {
                    code: "en-US",
                    content: "Printing Options"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Printing Options"
                }
            ]
        },
    )
}