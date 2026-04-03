import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {cancelShipment} from "../helpers";
import {CancelShipmentRequestData, CancelShipmentResponseData} from "../types/glsCancelShipment";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "cancelShipment",
                documentation: [
                    {
                        code: "en-US",
                        content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Cancel shipment"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Cancel shipment",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.",
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