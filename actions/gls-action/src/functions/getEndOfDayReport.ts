import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken} from "../helpers";
import axios from "axios";
import {EndOfDayRequestData, EndOfDayResponseData, EndOfDayResponseDataSchema} from "../types/glsEndOfDayRequest";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "getEndOfDayReport",
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Get end of day report"
                    }
                ],
                name: [
                    {
                        code: "en-US",
                        content: "Get end of day report",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Returns the GLS end of day report.",
                    }
                ],
                signature: "(data: GLS_END_OF_DAY_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA",
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
                                content: "The end of day report request data.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_END_OF_DAY_REQUEST_DATA",
                    "GLS_END_OF_DAY_RESPONSE_DATA",
                ],
            },
            handler: async (data: EndOfDayRequestData, context: HerculesFunctionContext): Promise<EndOfDayResponseData> => {
                const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

                try {
                    const result = await axios.post(`${url}/rs/shipments/endofday?date=${data.date}`, {}, {
                        headers: {
                            Authorization: `Bearer ${await getAuthToken(context)}`,
                            "Content-Type": "application/glsVersion1+json"
                        }
                    })
                    return EndOfDayResponseDataSchema.parse(result.data)
                } catch (error: any) {
                    throw new RuntimeErrorException("GET_END_OF_DAY_INFO_FAILED", error.toString())
                }

            }
        },
    )
}