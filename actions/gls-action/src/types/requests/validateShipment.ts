import z from "zod";
import {InternalShipmentSchma, ShipmentSchema} from "../definitions/shipmentSchema";

export const ValidateShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
})
export type ValidateShipmentRequestData = z.infer<typeof ValidateShipmentRequestDataSchema>
export const ValidateShipmentResponseDataSchema = z.object({
    success: z.boolean(),
    validationResult: z.object({
        Issues: z.array(z.object({
            Rule: z.string(),
            Location: z.string(),
            Parameters: z.array(z.string()).optional()
        }))
    })
})
export type ValidateShipmentResponseData = z.infer<typeof ValidateShipmentResponseDataSchema>
export const InternalValidateShipmentRequestDataSchema = z.object({
    Shipment: InternalShipmentSchma,
})
export type InternalValidateShipmentRequestData = z.infer<typeof InternalValidateShipmentRequestDataSchema>