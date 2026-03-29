import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken} from "../helpers";
import axios from "axios";
import {
    ReprintParcelRequestData,
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema
} from "../types/glsReprintParcel";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "reprintParcel",
                name: [
                    {
                        code: "en-US",
                        content: "Reprint parcel",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Reprints the labels for a GLS parcel.",
                    }
                ],
                signature: "(data: GLS_REPRINT_PARCEL_REQUEST_DATA): GLS_REPRINT_PARCEL_RESPONSE_DATA",
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
                                content: "The reprint parcel request data.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_REPRINT_PARCEL_REQUEST_DATA",
                    "GLS_REPRINT_PARCEL_RESPONSE_DATA",
                ],
            },
            handler: async (data: ReprintParcelRequestData, context: HerculesFunctionContext): Promise<ReprintParcelResponseData> => {
                const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

                try {
                    const result = await axios.post(`${url}/rs/shipments/reprintparcel`, data, {
                        headers: {
                            Authorization: `Bearer ${await getAuthToken(context)}`,
                            "Content-Type": "application/glsVersion1+json"
                        }
                    })
                    return ReprintParcelResponseDataSchema.parse(result.data)
                } catch (error: any) {
                    console.log(error)
                    throw new RuntimeErrorException("REPRINT_PARCEL_FAILED", error.toString())
                }
            }
        }
    )
}