import {ActionSdk} from "@code0-tech/hercules";
import {zodSchemaToTypescriptDefs} from "../../helpers";
import {AddressSchema} from "./glsAddress";
import {z} from "zod";


export const ConsigneeSchema = z.object({
    ConsigneeID: z.string().max(40).optional(),
    CostCenter: z.string().max(80).optional(),
    Category: z.enum(["BUSINESS", "PRIVATE"]).optional(),
    Address: AddressSchema
})
export type ConsigneeSchema = z.infer<typeof ConsigneeSchema>

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CONSIGNEE",
            type: zodSchemaToTypescriptDefs(
                "GLS_CONSIGNEE",
                ConsigneeSchema,
                {
                    GLS_ADDRESS: AddressSchema
                }
            ).get("GLS_CONSIGNEE")!,
            name: [
                {
                    code: "en-US",
                    content: "Consignee"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Consignee"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS"
            ]
        },
    )
}
