import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef, zodSchemaToTypescriptDefs} from "../helpers";
import z from "zod";
import {AddressSchema} from "./glsAddress";

export const EndOfDayRequestDataSchema = z.object({
    date: z.iso.date()
})
export const EndOfDayResponseDataSchema = z.object({
    Shipments: z.array(z.object({
        ShippingDate: z.iso.date(),
        Product: z.enum(["PARCEL", "EXPRESS"]),
        Consignee: z.object({
            Address: AddressSchema
        }),
        Shipper: z.object({
            ContactID: z.string(),
            AlternativeShipperAddress: AddressSchema.optional(),
        }),
        ShipmentUnit: z.array(z.object({
            Weight: z.string(),
            TrackID: z.string(),
            ParcelNumber: z.string()
        })).optional()
    })).optional()
})
export type EndOfDayRequestData = z.infer<typeof EndOfDayRequestDataSchema>
export type EndOfDayResponseData = z.infer<typeof EndOfDayResponseDataSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_END_OF_DAY_REQUEST_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_END_OF_DAY_REQUEST_DATA",
                EndOfDayRequestDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "End of day request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "End of day request data"
                }
            ]
        },
        {
            identifier: "GLS_END_OF_DAY_RESPONSE_DATA",
            type: zodSchemaToTypescriptDefs(
                "GLS_END_OF_DAY_RESPONSE_DATA",
                EndOfDayResponseDataSchema,
                {
                    GLS_ADDRESS: AddressSchema
                }
            ).get("GLS_END_OF_DAY_RESPONSE_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "End of day response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "End of day response data"
                }
            ]
        },
    )
}
