import axios from "axios";
import {
    Description, DisplayIcon,
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
    ValidateShipmentResponseData,
    ValidateShipmentResponseDataSchema,
} from "../data_types/glsValidateShipment.js";
import { Shipment } from "../data_types/glsShipment.js";

@Identifier("validateShipment")
@DisplayIcon("codezero:gls")
@Signature("(Shipment: GLS_SHIPMENT): GLS_VALIDATE_SHIPMENT_RESPONSE_DATA")
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
    runtimeName: "Shipment",
    name: [{ code: "en-US", content: "Shipment" }],
    description: [{ code: "en-US", content: "The shipment to validate." }],
})
export class ValidateShipmentFunction {
    async run(context: FunctionContext, Shipment: Shipment): Promise<ValidateShipmentResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;
        const contactID = (context.matchedConfig.findConfig("contact_id") as string) || "";

        try {
            const result = await axios.post(
                `${url}/rs/shipments/validate`,
                transformValidateShipmentRequestDataToInternalFormat({ Shipment }, context, contactID),
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
