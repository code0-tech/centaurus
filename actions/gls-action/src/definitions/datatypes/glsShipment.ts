import {zodSchemaToTypescriptDefs} from "../../helpers";
import {z} from "zod";
import {ConsigneeSchema} from "./glsConsignee";
import {AddressSchema} from "./glsAddress";
import {InternalShipmentServiceSchema, ShipmentServiceSchema} from "./glsShipmentService";
import {InternalShipmentUnitSchema, ShipmentUnitSchema} from "./glsShipmentUnit";
import {InternalShipperSchema, ShipperSchema} from "./glsShipper";
import {ActionSdk} from "@code0-tech/hercules";

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
    Service: z.lazy(() => ShipmentServiceSchema),
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
    Service: z.lazy(() => InternalShipmentServiceSchema),
    ShipmentUnit: InternalShipmentUnitSchema
})

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT",
            type: zodSchemaToTypescriptDefs(
                "GLS_SHIPMENT",
                ShipmentSchema,
                {
                    GLS_ADDRESS: AddressSchema,
                    GLS_CONSIGNEE: ConsigneeSchema,
                    GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
                    GLS_SHIPPER: ShipperSchema,
                    GLS_SHIPMENT_SERVICE: ShipmentServiceSchema,
                }).get("GLS_SHIPMENT")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment"
                }
            ],
            linkedDataTypes: [
                "GLS_SHIPMENT_SERVICE",
                "GLS_ADDRESS",
                "GLS_SHIPMENT_UNIT",
                "GLS_CONSIGNEE",
                "GLS_SHIPPER"
            ]
        },
        {
            identifier: "GLS_SHIPMENT_WITHOUT_SERVICES",
            type: zodSchemaToTypescriptDefs(
                "GLS_SHIPMENT_WITHOUT_SERVICES",
                ShipmentWithoutServicesSchema,
                {
                    GLS_ADDRESS: AddressSchema,
                    GLS_CONSIGNEE: ConsigneeSchema,
                    GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
                    GLS_SHIPPER: ShipperSchema,
                }).get("GLS_SHIPMENT_WITHOUT_SERVICES")!,
            name: [
                {
                    code: "en-US",
                    content: "Shipment without services"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment without services"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS",
                "GLS_SHIPMENT_UNIT",
                "GLS_CONSIGNEE",
                "GLS_SHIPPER"
            ]
        },
    )
}