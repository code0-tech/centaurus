import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../helpers";
import z from "zod";

export const CancelShipmentRequestDataSchema = z.object({
    TrackID: z.string()
})
export type CancelShipmentRequestData = z.infer<typeof CancelShipmentRequestDataSchema>
export const CancelShipmentResponseDataSchema = z.object({
    TrackID: z.string(),
    result: z.enum(["CANCELLED", "CANCELLATION_PENDING", "SCANNED", "ERROR"])
})
export type CancelShipmentResponseData = z.infer<typeof CancelShipmentResponseDataSchema>

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
                CancelShipmentRequestDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Cancel shipment request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Cancel shipment request data"
                }
            ]
        },
        {
            identifier: "GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
            type: singleZodSchemaToTypescriptDef("GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
                CancelShipmentResponseDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Cancel shipment response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Cancel shipment response data"
                }
            ]
        }
    )
}
