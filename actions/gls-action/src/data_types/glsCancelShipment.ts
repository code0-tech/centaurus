import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const CancelShipmentRequestDataSchema = z.object({
    TrackID: z.string(),
});
export type CancelShipmentRequestData = z.infer<typeof CancelShipmentRequestDataSchema>;

export const CancelShipmentResponseDataSchema = z.object({
    TrackID: z.string(),
    result: z.enum(["CANCELLED", "CANCELLATION_PENDING", "SCANNED", "ERROR"]),
});
export type CancelShipmentResponseData = z.infer<typeof CancelShipmentResponseDataSchema>;

@Identifier("GLS_CANCEL_SHIPMENT_REQUEST_DATA")
@Name({ code: "en-US", content: "Cancel shipment request data" })
@DisplayMessage({ code: "en-US", content: "Cancel shipment request data" })
@Schema(CancelShipmentRequestDataSchema)
export class GlsCancelShipmentRequestDataType {}

@Identifier("GLS_CANCEL_SHIPMENT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Cancel shipment response data" })
@DisplayMessage({ code: "en-US", content: "Cancel shipment response data" })
@Schema(CancelShipmentResponseDataSchema)
export class GlsCancelShipmentResponseDataType {}
