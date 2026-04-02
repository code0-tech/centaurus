import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken} from "../helpers";
import axios from "axios";
import {
    UpdateParcelWeightRequestData,
    UpdateParcelWeightResponseData,
    UpdateParcelWeightResponseDataSchema
} from "../types/glsUpdateParcelWeight";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "updateParcelWeight",
                documentation: [
                    {
                        code: "en-US",
                        content: "Updates the weight of an already-created parcel. Useful when the final weight is only known after packaging."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Update parcel weight"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Update parcel weight",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Updates the weight of an already-created parcel. Useful when the final weight is only known after packaging.",
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
                const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

                try {
                    const result = await axios.post(`${url}/rs/shipments/updateparcelweight`, data, {
                        headers: {
                            Authorization: `Bearer ${await getAuthToken(context)}`,
                            "Content-Type": "application/glsVersion1+json"
                        }
                    })
                    return UpdateParcelWeightResponseDataSchema.parse(result.data)
                } catch (error: any) {
                    throw new RuntimeErrorException("UPDATE_PARCEL_WEIGHT_FAILED", error.toString())
                }
            }
        },
    )
}