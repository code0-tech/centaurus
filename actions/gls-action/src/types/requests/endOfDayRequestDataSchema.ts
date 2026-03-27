import z from "zod";
import {AddressSchema} from "../definitions/addressSchema";

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