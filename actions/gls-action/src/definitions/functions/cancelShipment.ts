import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {cancelShipment} from "../../helpers";
import {CancelShipmentRequestData, CancelShipmentResponseData} from "../datatypes/glsCancelShipment";

export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "cancelShipment",
                name: [
                    {
                        code: "en-US",
                        content: "Cancel shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Cancels a GLS shipment.",
                    }
                ],
                signature: "(data: GLS_CANCEL_SHIPMENT_REQUEST_DATA): GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
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
                                content: "The cancel shipment request data.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
                    "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
                ],
            },
            handler: async (data: CancelShipmentRequestData, context: HerculesFunctionContext): Promise<CancelShipmentResponseData> => {
                try {
                    return await cancelShipment(data, context)
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