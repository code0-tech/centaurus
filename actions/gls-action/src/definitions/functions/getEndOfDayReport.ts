import {sdk} from "../../index";
import {EndOfDayRequestData, EndOfDayResponseData} from "../../types";
import {HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getEndOfDayInfo} from "../../helpers";

export function register() {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "getEndOfDayReport",
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
                try {
                    return await getEndOfDayInfo(data, context)
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