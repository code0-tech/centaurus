import {sdk} from "../../index";
import {ReprintParcelRequestData, ReprintParcelResponseData} from "../../types";
import {HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {reprintParcel} from "../../helpers";

export function register() {
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
                try {
                    return await reprintParcel(data, context)
                } catch (error) {
                    if (typeof error === "string") {
                        throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
                    }
                    throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
                }
            }
        }
    )
}