import axios from "axios";
import {
    Description,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getAuthToken, transformValidateShipmentRequestDataToInternalFormat } from "../helpers.js";
import {
    ValidateShipmentRequestData,
    ValidateShipmentResponseData,
    ValidateShipmentResponseDataSchema,
} from "../data_types/glsValidateShipment.js";

@Identifier("validateShipment")
@Signature("(data: GLS_VALIDATE_SHIPMENT_REQUEST_DATA): GLS_VALIDATE_SHIPMENT_RESPONSE_DATA")
@Name({ code: "en-US", content: "Validate shipment" })
@DisplayMessage({ code: "en-US", content: "Validate shipment" })
@Documentation({
    code: "en-US",
    content: "Validates a shipment against the GLS API without creating it.\nUse this before `createShipment` functions to catch errors early.",
})
@Description({
    code: "en-US",
    content: "Validates a shipment against the GLS API without creating it.\nUse this before `createShipment` functions to catch errors early.",
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The shipment data to validate." }],
})
export class ValidateShipmentFunction {
    async run(context: FunctionContext, data: ValidateShipmentRequestData): Promise<ValidateShipmentResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;
        const contactID = (context.matchedConfig.findConfig("contact_id") as string) || "";

        try {
            const result = await axios.post(
                `${url}/rs/shipments/validate`,
                transformValidateShipmentRequestDataToInternalFormat(data, context, contactID),
                {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken(context)}`,
                        "Content-Type": "application/glsVersion1+json",
                    },
                }
            );
            return ValidateShipmentResponseDataSchema.parse(result.data);
        } catch (error: any) {
            throw new RuntimeError("VALIDATE_SHIPMENT_FAILED", error.toString());
        }
    }
}
