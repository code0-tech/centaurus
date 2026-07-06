import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { InternalShipmentSchema, ShipmentSchema } from "./glsShipment.js";

export const ValidateShipmentRequestDataSchema = z.object({
    Shipment: ShipmentSchema,
});
export type ValidateShipmentRequestData = z.infer<typeof ValidateShipmentRequestDataSchema>;

export const ValidateShipmentResponseDataSchema = z.object({
    success: z.boolean(),
    validationResult: z.object({
        Issues: z.array(
            z.object({
                Rule: z.string(),
                Location: z.string(),
                Parameters: z.array(z.string()).optional(),
            })
        ),
    }),
});
export type ValidateShipmentResponseData = z.infer<typeof ValidateShipmentResponseDataSchema>;

export const InternalValidateShipmentRequestDataSchema = z.object({
    Shipment: InternalShipmentSchema,
});
export type InternalValidateShipmentRequestData = z.infer<typeof InternalValidateShipmentRequestDataSchema>;

@Identifier("GLS_VALIDATE_SHIPMENT_REQUEST_DATA")
@Name({ code: "en-US", content: "Validate shipment request data" })
@DisplayMessage({ code: "en-US", content: "Validate shipment request data" })
@Schema(ValidateShipmentRequestDataSchema)
export class GlsValidateShipmentRequestDataType {}

@Identifier("GLS_VALIDATE_SHIPMENT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Validate shipment response data" })
@DisplayMessage({ code: "en-US", content: "Validate shipment response data" })
@Schema(ValidateShipmentResponseDataSchema)
export class GlsValidateShipmentResponseDataType {}
