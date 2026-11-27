import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { searchObjects } from "../helpers.js";
import { HubSpotSearchResult } from "../data_types/hubspotSearchResult.js";
import { HubSpotSearchFilter } from "../data_types/hubspotSearchFilter.js";

@Identifier("hubspotSearchObjects")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, ObjectType: string, Filters: LIST<HUBSPOT_SEARCH_FILTER>, Query?: string, Properties?: LIST<TEXT>, Limit?: number): HUBSPOT_SEARCH_RESULT")
@Name({ code: "en-US", content: "Search objects" })
@DisplayMessage({ code: "en-US", content: "Search HubSpot ${ObjectType}" })
@Documentation({ code: "en-US", content: "Searches a HubSpot CRM object type (e.g. contacts, deals, companies) with the CRM search API. All filters must match (AND); build them with Create search filter. An optional free-text query narrows the result further. Returns up to Limit matches (default 25, max 200)." })
@Description({ code: "en-US", content: "Searches HubSpot CRM objects." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "ObjectType", name: [{ code: "en-US", content: "Object type" }], description: [{ code: "en-US", content: "The CRM object type to search (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "Filters", name: [{ code: "en-US", content: "Filters" }], description: [{ code: "en-US", content: "The filters an object must all match. May be empty if a query is given." }] })
@Parameter({ runtimeName: "Query", name: [{ code: "en-US", content: "Query" }], description: [{ code: "en-US", content: "Optional free-text search query." }], optional: true })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Optional list of properties to return for each object. Defaults to the standard HubSpot set." }], optional: true })
@Parameter({ runtimeName: "Limit", name: [{ code: "en-US", content: "Limit" }], description: [{ code: "en-US", content: "Optional maximum number of results (1-200, default 25)." }], optional: true })
export class HubSpotSearchObjectsFunction {
    async run(_context: FunctionContext, AccessToken: string, ObjectType: string, Filters: HubSpotSearchFilter[], Query?: string, Properties?: string[], Limit?: number): Promise<HubSpotSearchResult> {
        try {
            return await searchObjects(ObjectType, Filters, Query, Properties, Limit, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_SEARCHING_HUBSPOT_OBJECTS", error instanceof Error ? error.message : "unknown error");
        }
    }
}
