import {singleZodSchemaToTypescriptDef} from "../../helpers";
import {z} from "zod";
import {ActionSdk} from "@code0-tech/hercules";


export const ReturnOptionsSchema = z.object({
    ReturnPrintData: z.boolean().default(true).optional(),
    ReturnRoutingInfo: z.boolean().default(true).optional()
})
export type ReturnOptions = z.infer<typeof ReturnOptionsSchema>

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_RETURN_OPTIONS",
            type: singleZodSchemaToTypescriptDef(
                "GLS_RETURN_OPTIONS",
                ReturnOptionsSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Return Options"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Return Options"
                }
            ]
        },
    )
}
