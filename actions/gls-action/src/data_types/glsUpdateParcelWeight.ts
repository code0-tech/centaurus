import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const UpdateParcelWeightRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    Weight: z.number().min(0.1),
});
export type UpdateParcelWeightRequestData = z.infer<typeof UpdateParcelWeightRequestDataSchema>;

export const UpdateParcelWeightResponseDataSchema = z.object({
    UpdatedWeight: z.string(),
});
export type UpdateParcelWeightResponseData = z.infer<typeof UpdateParcelWeightResponseDataSchema>;

@Identifier("GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA")
@Name({ code: "en-US", content: "Update parcel weight request data" })
@DisplayMessage({ code: "en-US", content: "Update parcel weight request data" })
@Schema(UpdateParcelWeightRequestDataSchema)
export class GlsUpdateParcelWeightRequestDataType {}

@Identifier("GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Update parcel weight response data" })
@DisplayMessage({ code: "en-US", content: "Update parcel weight response data" })
@Schema(UpdateParcelWeightResponseDataSchema)
export class GlsUpdateParcelWeightResponseDataType {}
