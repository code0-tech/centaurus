import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { AddressSchema } from "./glsAddress.js";

export const EndOfDayRequestDataSchema = z.object({
    date: z.iso.date(),
});
export type EndOfDayRequestData = z.infer<typeof EndOfDayRequestDataSchema>;

export const EndOfDayResponseDataSchema = z.object({
    Shipments: z.array(
        z.object({
            ShippingDate: z.iso.date(),
            Product: z.enum(["PARCEL", "EXPRESS"]),
            Consignee: z.object({
                Address: AddressSchema,
            }),
            Shipper: z.object({
                ContactID: z.string(),
                AlternativeShipperAddress: AddressSchema.optional(),
            }),
            ShipmentUnit: z.array(
                z.object({
                    Weight: z.string(),
                    TrackID: z.string(),
                    ParcelNumber: z.string(),
                })
            ).optional(),
        })
    ).optional(),
});
export type EndOfDayResponseData = z.infer<typeof EndOfDayResponseDataSchema>;

@Identifier("GLS_END_OF_DAY_REQUEST_DATA")
@Name({ code: "en-US", content: "End of day request data" })
@DisplayMessage({ code: "en-US", content: "End of day request data" })
@Schema(EndOfDayRequestDataSchema)
export class GlsEndOfDayRequestDataType {}

@Identifier("GLS_END_OF_DAY_RESPONSE_DATA")
@Name({ code: "en-US", content: "End of day response data" })
@DisplayMessage({ code: "en-US", content: "End of day response data" })
@Schema(EndOfDayResponseDataSchema)
export class GlsEndOfDayResponseDataType {}
