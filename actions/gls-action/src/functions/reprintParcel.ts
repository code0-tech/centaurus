import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken} from "../helpers";
import axios from "axios";
import {
    ReprintParcelRequestData,
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema
} from "../types/glsReprintParcel";

export default (sdk: ActionSdk) => {
    return sdk.registerRuntimeFunctionDefinitionsAndFunctionDefinitions(
        {
            definition: {
                runtimeName: "reprintParcel",
                documentation: [
                    {
                        code: "en-US",
                        content: "Reprints the label for an existing parcel. Use this if the original label is damaged, lost, or needs to be printed in a different format."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Reprint parcel"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Reprint parcel",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Reprints the label for an existing parcel. Use this if the original label is damaged, lost, or needs to be printed in a different format.",
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