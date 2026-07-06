//TODO: Why is the request data here wrapped within a object and isn't a direct parameter of 3

import axios from "axios";
import {
    Description, DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getAuthToken } from "../helpers.js";
import {
    AllowedServicesRequestData,
    AllowedServicesResponseData,
    AllowedServicesResponseDataSchema,
} from "../data_types/glsAllowedServices.js";

@Identifier("getAllowedServices")
@DisplayIcon("codezero:gls")
@Signature("(data: GLS_ALLOWED_SERVICES_REQUEST_DATA): GLS_ALLOWED_SERVICES_RESPONSE_DATA")
@Name({ code: "en-US", content: "Get allowed services" })
@DisplayMessage({ code: "en-US", content: "Get allowed services" })
@Documentation({
    code: "en-US",
    content: "Returns the GLS services available for a given origin/destination country and ZIP code combination.",
})
@Description({
    code: "en-US",
    content: "Returns the GLS services available for a given origin/destination country and ZIP code combination.",
})
@Parameter({
    runtimeName: "data",
    name: [{ code: "en-US", content: "Data" }],
    description: [{ code: "en-US", content: "The allowed services request data." }],
})
export class GetAllowedServicesFunction {
    async run(context: FunctionContext, data: AllowedServicesRequestData): Promise<AllowedServicesResponseData> {
        try {
            const url = context.matchedConfig.findConfig("ship_it_api_url") as string;
            const result = await axios.post(`${url}/rs/shipments/allowedservices`, data, {
                headers: {
                    Authorization: `Bearer ${await getAuthToken(context)}`,
                    "Content-Type": "application/glsVersion1+json",
                },
            });
            return AllowedServicesResponseDataSchema.parse(result.data);
        } catch (error) {
            if (typeof error === "string") {
                throw new RuntimeError("" +
                    "ERROR_CREATING_GLS_SHIPMENT", error);
            }
            throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while fetching the allowed GLS services.");
        }
    }
}
