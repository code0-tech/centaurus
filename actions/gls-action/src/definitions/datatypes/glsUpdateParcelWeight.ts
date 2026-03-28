import z from "zod";
import {singleZodSchemaToTypescriptDef} from "../../helpers";
import {ActionSdk} from "@code0-tech/hercules";

export const UpdateParcelWeightRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    Weight: z.number().min(0.10)
})
export type UpdateParcelWeightRequestData = z.infer<typeof UpdateParcelWeightRequestDataSchema>
export const UpdateParcelWeightResponseDataSchema = z.object({
    UpdatedWeight: z.string()
})
export type UpdateParcelWeightResponseData = z.infer<typeof UpdateParcelWeightResponseDataSchema>

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
                UpdateParcelWeightRequestDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Update parcel weight request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Update parcel weight request data"
                }
            ]
        },
        {
            identifier: "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
                UpdateParcelWeightResponseDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Update parcel weight response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Update parcel weight response data"
                }
            ]
        },
    )
}
