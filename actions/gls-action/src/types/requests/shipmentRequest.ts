import z from "zod"
import {InternalShipmentSchma, ShipmentSchema} from "../../definitions/datatypes/glsShipment";
import {PrintingOptionsSchema} from "../../definitions/datatypes/glsPrintingOptions";
import {ReturnOptionsSchema} from "../../definitions/datatypes/glsReturnOptions";
import {CustomContentSchema} from "../../definitions/datatypes/glsCustomContent";

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