import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { hubSpotObjectSchema } from "./hubspotObjectBase.js";

export const HubSpotSearchResultSchema = z.object({
    total: z.number().describe("Total number of objects matching the search."),
    results: z.array(hubSpotObjectSchema()).describe("The page of matching objects."),
});
export type HubSpotSearchResult = z.infer<typeof HubSpotSearchResultSchema>;

@Identifier("HUBSPOT_SEARCH_RESULT")
@Name({ code: "en-US", content: "HubSpot search result" })
@DisplayMessage({ code: "en-US", content: "HubSpot search result (${total} matches)" })
@Schema(HubSpotSearchResultSchema)
export class HubSpotSearchResultDataType {}
