import {z} from "zod";
import {zodSchemaToTypescriptDefs} from "../../helpers";
import {ShipmentSchema} from "./glsShipment";
import {InternalUnitServiceSchema, UnitServiceSchema} from "./glsUnitService";
import {ActionSdk} from "@code0-tech/hercules";


export const ShipmentUnitSchema = z.array(
    z.object({
        ShipmentUnitReference: z.string().max(40).optional(),
        PartnerParcelNumber: z.string().max(50).optional(),
        Weight: z.number().min(0.10).max(99),
        Note1: z.string().max(50).optional(),
        Note2: z.string().max(50).optional(),
        Service: UnitServiceSchema,
    })
).min(1)
export type ShipmentUnit = z.infer<typeof ShipmentUnitSchema.element>
export const InternalShipmentUnitSchema = ShipmentUnitSchema.element.extend(
    {
        Service: InternalUnitServiceSchema.optional()
    }
).array().min(1)

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT_UNIT",
            type: zodSchemaToTypescriptDefs(
                "XXX",
                ShipmentSchema,
                {
                    GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
                }
            ).get("GLS_SHIPMENT_UNIT")!, // Hacky because shipment unit is an array
            name: [
                {
                    code: "en-US",
                    content: "Shipment Unit"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment Unit"
                }
            ],
            linkedDataTypes: [
                "GLS_UNIT_SERVICE",
            ]
        },
    )
}
