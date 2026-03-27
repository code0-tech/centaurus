import {sdk} from "../../index";
import {
    UpdateParcelWeightRequestData,
    UpdateParcelWeightResponseData
} from "../../types";
import {HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {updateParcelWeight} from "../../helpers";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "updateParcelWeight",
                name: [
                    {
                        code: "en-US",
                        content: "Update parcel weight",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Updates the weight of a GLS parcel.",
                    }
                ],
                signature: "(data: GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA",
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
                                content: "The update parcel weight request data.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
                    "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
                ],
            },
            handler: async (data: UpdateParcelWeightRequestData, context: HerculesFunctionContext): Promise<UpdateParcelWeightResponseData> => {
                try {
                    return await updateParcelWeight(data, context)
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