import {ActionSdk, HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";
import {getAuthToken} from "../../helpers";
import axios from "axios";
import {
    AllowedServicesRequestData,
    AllowedServicesResponseData,
    AllowedServicesResponseDataSchema
} from "../datatypes/glsAllowedServices";

export function register(sdk: ActionSdk) {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "getAllowedServices",
                name: [
                    {
                        code: "en-US",
                        content: "Get allowed services",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Returns the allowed GLS services for a given set of parameters.",
                    }
                ],
                signature: "(data: GLS_ALLOWED_SERVICES_REQUEST_DATA): GLS_ALLOWED_SERVICES_RESPONSE_DATA",
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
                                content: "The allowed services request data.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_ALLOWED_SERVICES_REQUEST_DATA",
                    "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
                ],
            },
            handler: async (data: AllowedServicesRequestData, context: HerculesFunctionContext): Promise<AllowedServicesResponseData> => {
                try {
                    const url = context.matchedConfig.findConfig("ship_it_api_url") as string;
                    const result = await axios.post(`${url}/rs/shipments/allowedservices`, data, {
                        headers: {
                            Authorization: `Bearer ${await getAuthToken(context)}`,
                            "Content-Type": "application/glsVersion1+json"
                        }
                    })
                    return AllowedServicesResponseDataSchema.parse(result.data)
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