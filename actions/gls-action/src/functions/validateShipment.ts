import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken, transformValidateShipmentRequestDataToInternalFormat} from "../helpers";
import axios from "axios";
import {
    ValidateShipmentRequestData,
    ValidateShipmentResponseData,
    ValidateShipmentResponseDataSchema
} from "../types/glsValidateShipment";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "validateShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Validates a shipment against the GLS API without creating it. Use this before `createShipment` functions to catch errors early."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Validate shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Validate shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Validates a shipment against the GLS API without creating it. Use this before `createShipment` functions to catch errors early.",
                    }
                ],
                signature: "(data: GLS_VALIDATE_SHIPMENT_REQUEST_DATA): GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
                parameters: [
                    {
                        runtimeName: "data",
                        name: [
                            {
                                code: "en-US",
                                content: "Data",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The shipment data to validate.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
                    "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
                ],
            },
            handler: async (data: ValidateShipmentRequestData, context: HerculesFunctionContext): Promise<ValidateShipmentResponseData> => {
                const url = context?.matchedConfig.findConfig("ship_it_api_url") as string;
                const contactID = context?.matchedConfig.findConfig("contact_id") as string || ""

                try {
                    const result = await axios.post(`${url}/rs/shipments/validate`, transformValidateShipmentRequestDataToInternalFormat(data, context, contactID), {
                        headers: {
                            Authorization: `Bearer ${await getAuthToken(context)}`,
                            "Content-Type": "application/glsVersion1+json"
                        }
                    })
                    return ValidateShipmentResponseDataSchema.parse(result.data)
                } catch (error: any) {
                    throw new RuntimeErrorException("VALIDATE_SHIPMENT_FAILED", error.toString())
                }
            }
        },
    )
}