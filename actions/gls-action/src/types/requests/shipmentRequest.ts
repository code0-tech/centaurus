import z from "zod"
import {InternalShipmentSchma, ShipmentSchema} from "../definitions/shipmentSchema";
import {CustomContentSchema} from "../definitions/customContentSchema";
import {ReturnOptionsSchema} from "../definitions/returnOptionsSchema";
import {PrintingOptionsSchema} from "../definitions/printingOptionsSchema";

export const ShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
    PrintingOptions: PrintingOptionsSchema,
    ReturnOptions: ReturnOptionsSchema.optional(),
    CustomContent: CustomContentSchema.optional(),
})
export const InternalShipmentRequestDataSchema = ShipmentRequestDataSchema.extend({
    Shipment: InternalShipmentSchma,
})
export type InternalShipmentRequestData = z.infer<typeof InternalShipmentRequestDataSchema>
export type ShipmentRequestData = z.infer<typeof ShipmentRequestDataSchema>
export const CreateParcelsResponseSchema = z.object({
    CreatedShipment: z.object({
        ShipmentReference: z.array(z.string()),
        ParcelData: z.array(z.object({
            TrackID: z.string().min(8).max(8),
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
            })
        })),
        PrintData: z.array(z.object({
            Data: z.string(),
            LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"])
        })),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string())
    }),
})
export type CreateParcelsResponse = z.infer<typeof CreateParcelsResponseSchema>