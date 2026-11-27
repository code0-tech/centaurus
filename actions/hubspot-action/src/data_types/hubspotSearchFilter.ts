import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

export const HUBSPOT_FILTER_OPERATORS = [
    "EQ", "NEQ", "LT", "LTE", "GT", "GTE", "BETWEEN", "IN", "NOT_IN",
    "HAS_PROPERTY", "NOT_HAS_PROPERTY", "CONTAINS_TOKEN", "NOT_CONTAINS_TOKEN",
] as const;

/**
 * A single CRM search filter. `value` is used by the comparison operators,
 * `values` by IN / NOT_IN, and `value` + `highValue` by BETWEEN.
 * HAS_PROPERTY / NOT_HAS_PROPERTY take no value.
 * See https://developers.hubspot.com/docs/api/crm/search
 */
export const HubSpotSearchFilterSchema = z.object({
    propertyName: z.string().describe("The property to filter on."),
    operator: z.enum(HUBSPOT_FILTER_OPERATORS).describe("The comparison operator."),
    value: z.string().optional().describe("The value to compare against."),
    values: z.array(z.string()).optional().describe("The values for IN / NOT_IN."),
    highValue: z.string().optional().describe("The upper bound for BETWEEN."),
});
export type HubSpotSearchFilter = z.infer<typeof HubSpotSearchFilterSchema>;

@Identifier("HUBSPOT_SEARCH_FILTER")
@Name({ code: "en-US", content: "HubSpot search filter" })
@DisplayMessage({ code: "en-US", content: "HubSpot filter ${propertyName} ${operator}" })
@Schema(HubSpotSearchFilterSchema)
export class HubSpotSearchFilterDataType {}
