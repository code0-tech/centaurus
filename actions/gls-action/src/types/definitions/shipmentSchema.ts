import {ConsigneeSchema} from "./consigneeSchema";
import {InternalShipperSchema, ShipperSchema} from "./shipperSchema";
import {InternalShipmentUnitSchema, ShipmentUnitSchema} from "./shipmentUnitSchema";
import {InternalShipmentServiceSchema, ShipmentServiceSchema} from "./shipmentServiceSchema";
import {AddressSchema} from "./addressSchema";
import {z} from "zod";

 export const ShipmentSchema = z.object({
    ShipmentReference: z.string().max(40).optional(),
    ShipmentDate: z.date().optional(),
    IncotermCode: z.int().max(99).optional(),
    Identifier: z.string().max(40).optional(),
    Product: z.enum(["PARCEL", "EXPRESS"]),
    ExpressAltDeliveryAllowed: z.boolean().optional(),
    Consignee: ConsigneeSchema,
    Shipper: ShipperSchema.optional(),
    Carrier: z.enum(["ROYALMAIL"]).optional(),
    ShipmentUnit: ShipmentUnitSchema,
    Service: ShipmentServiceSchema,
    Return: z.object({
        Address: AddressSchema
    }).optional()
})
 export const ShipmentWithoutServicesSchema = ShipmentSchema.omit({Service: true})
 export type ShipmentWithoutServices = z.infer<typeof ShipmentWithoutServicesSchema>
 export type Shipment = z.infer<typeof ShipmentSchema>
 export const InternalShipmentSchma = ShipmentSchema.extend({
    Middleware: z.string().max(40),
    Shipper: InternalShipperSchema,
    Service: InternalShipmentServiceSchema,
    ShipmentUnit: InternalShipmentUnitSchema
})