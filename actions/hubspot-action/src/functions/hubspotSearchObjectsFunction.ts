import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { searchObjects } from "../helpers.js";
import { HubSpotSearchResult } from "../data_types/hubspotSearchResult.js";

@Identifier("hubspotSearchObjects")
@DisplayIcon("simple:hubspot")
@Signature("(ObjectType: string, Query: string): HUBSPOT_SEARCH_RESULT")
@Name({ code: "en-US", content: "Search objects" })
@DisplayMessage({ code: "en-US", content: "Search HubSpot ${ObjectType} for ${Query}" })
@Documentation({ code: "en-US", content: "Runs a full-text search against a HubSpot CRM object type (e.g. contacts, deals, companies) and returns up to 25 matches." })
@Description({ code: "en-US", content: "Searches HubSpot CRM objects." })
@Parameter({ runtimeName: "ObjectType", name: [{ code: "en-US", content: "Object type" }], description: [{ code: "en-US", content: "The CRM object type to search (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "Query", name: [{ code: "en-US", content: "Query" }], description: [{ code: "en-US", content: "The free-text search query." }] })
export class HubSpotSearchObjectsFunction {
    async run(context: FunctionContext, ObjectType: string, Query: string): Promise<HubSpotSearchResult> {
        try {
            return await searchObjects(ObjectType, Query, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_SEARCHING_HUBSPOT_OBJECTS", error instanceof Error ? error.message : "unknown error");
        }
    }
}
