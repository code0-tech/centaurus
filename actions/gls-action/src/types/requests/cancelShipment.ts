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