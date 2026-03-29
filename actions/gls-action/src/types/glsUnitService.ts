import z from "zod"
import {zodSchemaToTypescriptDefs} from "../helpers";
import {ShipmentSchema} from "./glsShipment";
import {ActionSdk} from "@code0-tech/hercules";

export const UnitServiceSchema = z.array(z.object({
    Cash: z.object({
        Reason: z.string().max(160),
        Amount: z.number().min(1),
        Currency: z.string().max(3).min(3)
    }).optional(),
    AddonLiability: z.object({
        Amount: z.number().min(1),
        Currency: z.string().max(3).min(3),
        ParcelContent: z.string().max(255)
    }).optional(),
    HazardousGoods: z.object({
        HarzardousGood: z.array(
            z.object({
                Weight: z.number().min(1),
                GLSHazNo: z.string().max(8)
            }))
    }).optional(),
    ExWorks: z.object({}).optional(),
    LimitedQuantities: z.object({
        Weight: z.number().optional()
    }).optional()
})).optional()
export type UnitService = z.infer<typeof UnitServiceSchema>
// adding all service names
export const InternalUnitServiceSchema = z.array(z.object({
    Cash: z.object({
        serviceName: z.string("service_cash"),
        Reason: z.string(),
        Amount: z.number(),
        Currency: z.string()
    }).optional(),
    AddonLiability: z.object({
        serviceName: z.string("service_addonliability"),
        Amount: z.number(),
        Currency: z.string(),
        ParcelContent: z.string()
    }).optional(),
    HazardousGoods: z.object({
        serviceName: z.string("service_hazardousgoods"),
        HarzardousGood: z.array(
            z.object({
                Weight: z.number(),
                GLSHazNo: z.string()
            }))
    }),
    ExWorks: z.object({
        serviceName: z.string("service_exworks"),
    }).optional(),
    LimitedQuantities: z.object({
        serviceName: z.string("service_limitedquantities"),
        Weight: z.number().optional()
    }).optional()
})).optional()

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_UNIT_SERVICE",
            type: zodSchemaToTypescriptDefs(
                "XXX",
                ShipmentSchema,
                {
                    GLS_UNIT_SERVICE: UnitServiceSchema,
                }).get("GLS_UNIT_SERVICE")!, // Hacky way because unit service is an arra
            name: [
                {
                    code: "en-US",
                    content: "GLS unit service"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "GLS unit service"
                }
            ]
        }
    )
}


