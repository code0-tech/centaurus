import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const ReturnLabelsSchema = z.object({
    TemplateSet: z.enum([
        "NONE",
        "D_200",
        "PF_4_I",
        "PF_4_I_200",
        "PF_4_I_300",
        "PF_8_D_200",
        "T_200_BF",
        "T_300_BF",
        "ZPL_200",
        "ZPL_200_TRACKID_EAN_128",
        "ZPL_200_TRACKID_CODE_39",
        "ZPL_200_REFNO_EAN_128",
        "ZPL_200_REFNO_CODE_39",
        "ZPL_300",
        "ZPL_300_TRACKID_EAN_128",
        "ZPL_300_TRACKID_CODE_39",
        "ZPL_300_REFNO_EAN_128",
        "ZPL_300_REFNO_CODE_39",
    ]),
    LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"]),
});
export type ReturnLabels = z.infer<typeof ReturnLabelsSchema>;

export const PrintingOptionsSchema = z.object({
    ReturnLabels: ReturnLabelsSchema.nullish(),
    UseDefault: z.string().max(7).nullish(),
    DefinePrinter: z.object({
        LabelPrinter: z.string().max(255).nullish(),
        DocumentPrinter: z.string().max(255).nullish(),
    }).nullish(),
});
export type PrintingOptions = z.infer<typeof PrintingOptionsSchema>;

@Identifier("RETURN_LABELS")
@Name({ code: "en-US", content: "Return Labels" })
@DisplayMessage({ code: "en-US", content: "Return Labels" })
@Schema(ReturnLabelsSchema)
export class ReturnLabelsDataType {}

@Identifier("GLS_PRINTING_OPTIONS")
@Name({ code: "en-US", content: "Printing Options" })
@DisplayMessage({ code: "en-US", content: "Printing Options" })
@Schema(PrintingOptionsSchema)
export class GlsPrintingOptionsDataType {}
