import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { ReturnLabelsSchema } from "./glsPrintingOptions.js";

export const ReprintParcelRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    CreationDate: z.iso.date(),
    PrintingOptions: z.object({
        ReturnLabels: ReturnLabelsSchema,
    }),
});
export type ReprintParcelRequestData = z.infer<typeof ReprintParcelRequestDataSchema>;

export const ReprintParcelResponseDataSchema = z.object({
    CreatedShipment: z.object({
        ParcelData: z.array(
            z.object({
                TrackID: z.string().min(8).max(8),
                ShipmentUnitReference: z.array(z.string()).optional(),
                ParcelNumber: z.string(),
                Barcodes: z.object({
                    Primary2D: z.string(),
                    Secondary2D: z.string(),
                    Primary1D: z.string(),
                    Primary1DPrint: z.boolean(),
                }),
                RoutingInfo: z.object({
                    Tour: z.string(),
                    InboundSortingFlag: z.string(),
                    FinalLocationCode: z.string(),
                    LastRoutingDate: z.iso.date(),
                    HubLocation: z.string(),
                }),
            })
        ),
        PrintData: z.array(
            z.object({
                Data: z.string(),
                LabelFormat: z.enum(["PDF", "ZEBRA", "PNG", "PNG_200"]),
            })
        ),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string()),
    }),
});
export type ReprintParcelResponseData = z.infer<typeof ReprintParcelResponseDataSchema>;

@Identifier("GLS_REPRINT_PARCEL_REQUEST_DATA")
@Name({ code: "en-US", content: "Reprint parcel request data" })
@DisplayMessage({ code: "en-US", content: "Reprint parcel request data" })
@Schema(ReprintParcelRequestDataSchema)
export class GlsReprintParcelRequestDataType {}

@Identifier("GLS_REPRINT_PARCEL_RESPONSE_DATA")
@Name({ code: "en-US", content: "Reprint parcel response data" })
@DisplayMessage({ code: "en-US", content: "Reprint parcel response data" })
@Schema(ReprintParcelResponseDataSchema)
export class GlsReprintParcelResponseDataType {}
