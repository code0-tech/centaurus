import {ActionSdk} from "@code0-tech/hercules";
import z from "zod";
import {InternalShipmentSchma, ShipmentSchema} from "./glsShipment";
import {singleZodSchemaToTypescriptDef, zodSchemaToTypescriptDefs} from "../../helpers";


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

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
            type: zodSchemaToTypescriptDefs(
                "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
                ValidateShipmentRequestDataSchema,
                {
                    GLS_SHIPMENT: ShipmentSchema
                }
            ).get("GLS_VALIDATE_SHIPMENT_REQUEST_DATA")!,
            name: [
                {
                    code: "en-US",
                    content: "Validate shipment request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Validate shipment request data"
                }
            ],
            linkedDataTypes: [
                "GLS_SHIPMENT"
            ]
        },
        {
            identifier: "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
                ValidateShipmentResponseDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Validate shipment response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Validate shipment response data"
                }
            ]
        },
    )
}
