import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../helpers";
import {z} from "zod";

export const CustomContentSchema = z.object({
    CustomerLogo: z.string(),
    BarcodeContentType: z.enum(["TRACK_ID", "GLS_SHIPMENT_REFERENCE"]),
    Barcode: z.string().optional(),
    BarcodeType: z.enum(["EAN_128", "CODE_39"]).optional(),
    HideShipperAddress: z.boolean().optional()
})
export type CustomContent = z.infer<typeof CustomContentSchema>


export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CUSTOM_CONTENT",
            type: singleZodSchemaToTypescriptDef(
                "GLS_CUSTOM_CONTENT",
                CustomContentSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Custom content"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Custom content"
                }
            ]
        },
    )
}
