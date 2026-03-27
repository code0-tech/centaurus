import z from "zod";

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