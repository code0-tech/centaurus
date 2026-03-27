import {sdk} from "../../index";
import {HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {ValidateShipmentRequestData, ValidateShipmentResponseData} from "../../types";
import {validateShipment} from "../../helpers";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "validateShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Validate shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Validates a GLS shipment.",
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
                try {
                    return await validateShipment(data, context)
                } catch (error) {
                    if (typeof error === "string") {
                        throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                    }
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
                }
            }
        },
    )
}