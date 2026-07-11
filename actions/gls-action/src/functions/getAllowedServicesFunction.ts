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
    AllowedServicesResponseData,
    AllowedServicesResponseDataSchema,
} from "../data_types/glsAllowedServices.js";

@Identifier("getAllowedServices")
@DisplayIcon("codezero:gls")
@Signature("(SourceCountryCode: string, SourceZIPCode: string, DestinationCountryCode: string, DestinationZIPCode: string, ContactID?: string): GLS_ALLOWED_SERVICES_RESPONSE_DATA")
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
    runtimeName: "SourceCountryCode",
    name: [{ code: "en-US", content: "Source country code" }],
    description: [{ code: "en-US", content: "The ISO alpha-2 country code of the origin. For example, DE for Germany." }],
})
@Parameter({
    runtimeName: "SourceZIPCode",
    name: [{ code: "en-US", content: "Source ZIP code" }],
    description: [{ code: "en-US", content: "The ZIP code of the origin. Max length is 10 characters." }],
})
@Parameter({
    runtimeName: "DestinationCountryCode",
    name: [{ code: "en-US", content: "Destination country code" }],
    description: [{ code: "en-US", content: "The ISO alpha-2 country code of the destination. For example, FR for France." }],
})
@Parameter({
    runtimeName: "DestinationZIPCode",
    name: [{ code: "en-US", content: "Destination ZIP code" }],
    description: [{ code: "en-US", content: "The ZIP code of the destination. Max length is 10 characters." }],
})
@Parameter({
    runtimeName: "ContactID",
    name: [{ code: "en-US", content: "Contact ID" }],
    description: [{ code: "en-US", content: "The GLS contact ID to use for the request." }],
    optional: true,
})
export class GetAllowedServicesFunction {
    async run(
        context: FunctionContext,
        SourceCountryCode: string,
        SourceZIPCode: string,
        DestinationCountryCode: string,
        DestinationZIPCode: string,
        ContactID?: string
    ): Promise<AllowedServicesResponseData> {
        try {
            const url = context.matchedConfig.findConfig("ship_it_api_url") as string;
            const result = await axios.post(
                `${url}/rs/shipments/allowedservices`,
                {
                    Source: {
                        CountryCode: SourceCountryCode,
                        ZIPCode: SourceZIPCode,
                    },
                    Destination: {
                        CountryCode: DestinationCountryCode,
                        ZIPCode: DestinationZIPCode,
                    },
                    ContactID,
                },
                {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken(context)}`,
                        "Content-Type": "application/glsVersion1+json",
                    },
                }
            );
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
