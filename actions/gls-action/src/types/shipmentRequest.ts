import z from "zod"
import {InternalShipmentSchma, ShipmentSchema} from "./glsShipment";
import {PrintingOptionsSchema} from "./glsPrintingOptions";
import {ReturnOptionsSchema} from "./glsReturnOptions";
import {CustomContentSchema} from "./glsCustomContent";

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