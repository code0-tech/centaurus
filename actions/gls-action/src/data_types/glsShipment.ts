import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { ConsigneeSchema } from "./glsConsignee.js";
import { AddressSchema } from "./glsAddress.js";
import { InternalShipmentServiceSchema, ShipmentServiceSchema } from "./glsShipmentService.js";
import { InternalShipmentUnitSchema, ShipmentUnitSchema } from "./glsShipmentUnit.js";
import { InternalShipperSchema, ShipperSchema } from "./glsShipper.js";

export const ShipmentSchema = z.object({
    ShipmentReference: z.string().max(40).nullish(),
    ShippingDate: z.iso.date().nullish(),
    IncotermCode: z.int().max(99).nullish(),
    Identifier: z.string().max(40).nullish(),
    Product: z.enum(["PARCEL", "EXPRESS"]).default("PARCEL"),
    ExpressAltDeliveryAllowed: z.boolean().nullish(),
    Consignee: ConsigneeSchema,
    Shipper: ShipperSchema.nullish(),
    Carrier: z.enum(["ROYALMAIL"]).nullish(),
    ShipmentUnit: z.lazy(() => ShipmentUnitSchema),
    Service: z.lazy(() => ShipmentServiceSchema),
    Return: AddressSchema.nullish(),
});
export type Shipment = z.infer<typeof ShipmentSchema>;

export const ShipmentWithoutServicesSchema = ShipmentSchema.omit({ Service: true });
export type ShipmentWithoutServices = z.infer<typeof ShipmentWithoutServicesSchema>;

export const InternalShipmentSchema = ShipmentSchema.extend({
    Middleware: z.string().max(40),
    Shipper: InternalShipperSchema,
    Service: z.lazy(() => InternalShipmentServiceSchema),
    ShipmentUnit: z.lazy(() => InternalShipmentUnitSchema),
    Return: z.object({ Address: AddressSchema }).optional(),
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
