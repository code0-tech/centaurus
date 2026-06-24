import { z } from "zod";
import { InternalShipmentSchema, ShipmentSchema } from "./glsShipment.js";
import { PrintingOptionsSchema } from "./glsPrintingOptions.js";
import { ReturnOptionsSchema } from "./glsReturnOptions.js";
import { CustomContentSchema } from "./glsCustomContent.js";

export const ShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
    PrintingOptions: PrintingOptionsSchema,
    ReturnOptions: ReturnOptionsSchema.optional(),
    CustomContent: CustomContentSchema.optional(),
});
export type ShipmentRequestData = z.infer<typeof ShipmentRequestDataSchema>;

export const InternalShipmentRequestDataSchema = ShipmentRequestDataSchema.extend({
    Shipment: InternalShipmentSchema,
});
export type InternalShipmentRequestData = z.infer<typeof InternalShipmentRequestDataSchema>;
