import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { InternalUnitServiceSchema, UnitServiceSchema } from "./glsUnitService.js";

export const ShipmentUnitSchema = z.array(
    z.object({
        ShipmentUnitReference: z.string().max(40).optional(),
        PartnerParcelNumber: z.string().max(50).optional(),
        Weight: z.number().min(0.1).max(99),
        Note1: z.string().max(50).optional(),
        Note2: z.string().max(50).optional(),
        Service: UnitServiceSchema,
    })
).min(1);
export type ShipmentUnit = z.infer<typeof ShipmentUnitSchema.element>;

export const InternalShipmentUnitSchema = ShipmentUnitSchema.element
    .extend({
        Service: InternalUnitServiceSchema.optional(),
    })
    .array()
    .min(1);

@Identifier("GLS_SHIPMENT_UNIT")
@Name({ code: "en-US", content: "Shipment Unit" })
@DisplayMessage({ code: "en-US", content: "Shipment Unit" })
@Schema(ShipmentUnitSchema)
export class GlsShipmentUnitDataType {}
