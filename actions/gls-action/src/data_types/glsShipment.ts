import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { ConsigneeSchema } from "./glsConsignee.js";
import { AddressSchema } from "./glsAddress.js";
import { InternalShipmentServiceSchema, ShipmentServiceSchema } from "./glsShipmentService.js";
import { InternalShipmentUnitSchema, ShipmentUnitSchema } from "./glsShipmentUnit.js";
import { InternalShipperSchema, ShipperSchema } from "./glsShipper.js";

export const ShipmentSchema = z.object({
    ShipmentReference: z.string().max(40).optional(),
    ShipmentDate: z.iso.date().optional(),
    IncotermCode: z.int().max(99).optional(),
    Identifier: z.string().max(40).optional(),
    Product: z.enum(["PARCEL", "EXPRESS"]).default("PARCEL"),
    ExpressAltDeliveryAllowed: z.boolean().optional(),
    Consignee: ConsigneeSchema,
    Shipper: ShipperSchema.optional(),
    Carrier: z.enum(["ROYALMAIL"]).optional(),
    ShipmentUnit: z.lazy(() => ShipmentUnitSchema),
    Service: z.lazy(() => ShipmentServiceSchema),
    Return: z.object({
        Address: AddressSchema,
    }).optional(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;

export const ShipmentWithoutServicesSchema = ShipmentSchema.omit({ Service: true });
export type ShipmentWithoutServices = z.infer<typeof ShipmentWithoutServicesSchema>;

export const InternalShipmentSchema = ShipmentSchema.extend({
    Middleware: z.string().max(40),
    Shipper: InternalShipperSchema,
    Service: z.lazy(() => InternalShipmentServiceSchema),
    ShipmentUnit: z.lazy(() => InternalShipmentUnitSchema),
});

@Identifier("GLS_SHIPMENT")
@Name({ code: "en-US", content: "Shipment" })
@DisplayMessage({ code: "en-US", content: "Shipment" })
@Schema(ShipmentSchema)
export class GlsShipmentDataType {}

@Identifier("GLS_SHIPMENT_WITHOUT_SERVICES")
@Name({ code: "en-US", content: "Shipment without services" })
@DisplayMessage({ code: "en-US", content: "Shipment without services" })
@Schema(ShipmentWithoutServicesSchema)
export class GlsShipmentWithoutServicesDataType {}
