import {z} from "zod";
import {AddressSchema} from "./glsAddress";
import {zodSchemaToTypescriptDefs} from "../helpers";
import {ActionSdk} from "@code0-tech/hercules";

export const ShipperSchema = z.object({
    AlternativeShipperAddress: AddressSchema.optional(),
    Address: AddressSchema.optional(),
})
export type ShipperSchema = z.infer<typeof ShipperSchema>
export const InternalShipperSchema = ShipperSchema.extend({
    ContactID: z.string().optional()
})
export type InternalShipper = z.infer<typeof InternalShipperSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPPER",
            type: zodSchemaToTypescriptDefs(
                "GLS_SHIPPER",
                ShipperSchema,
                {
                    GLS_ADDRESS: AddressSchema
                }
            ).get("GLS_SHIPPER")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipper"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipper"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS"
            ]
        }
    )
}
