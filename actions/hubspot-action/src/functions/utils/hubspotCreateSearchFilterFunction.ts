import {
    Description, DisplayIcon, DisplayMessage, Documentation,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import {
    HUBSPOT_FILTER_OPERATORS, HubSpotSearchFilter, HubSpotSearchFilterSchema,
} from "../../data_types/hubspotSearchFilter.js";

@Identifier("hubspotCreateSearchFilter")
@DisplayIcon("simple:hubspot")
@Signature("(PropertyName: string, Operator: string, Value?: string, Values?: LIST<TEXT>, HighValue?: string): HUBSPOT_SEARCH_FILTER")
@Name({ code: "en-US", content: "Create search filter" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot filter ${PropertyName} ${Operator}" })
@Documentation({ code: "en-US", content: `Builds a filter for Search objects. Operators: ${HUBSPOT_FILTER_OPERATORS.join(", ")}. Comparison operators use Value, IN / NOT_IN use Values, BETWEEN uses Value and HighValue, HAS_PROPERTY / NOT_HAS_PROPERTY need no value.` })
@Description({ code: "en-US", content: "Creates a HubSpot search filter." })
@Parameter({ runtimeName: "PropertyName", name: [{ code: "en-US", content: "Property name" }], description: [{ code: "en-US", content: "The internal name of the property to filter on." }] })
@Parameter({ runtimeName: "Operator", name: [{ code: "en-US", content: "Operator" }], description: [{ code: "en-US", content: "The comparison operator, e.g. EQ, GT, IN, CONTAINS_TOKEN." }] })
@Parameter({ runtimeName: "Value", name: [{ code: "en-US", content: "Value" }], description: [{ code: "en-US", content: "The value to compare against (also the lower bound for BETWEEN)." }], optional: true })
@Parameter({ runtimeName: "Values", name: [{ code: "en-US", content: "Values" }], description: [{ code: "en-US", content: "The values for IN / NOT_IN." }], optional: true })
@Parameter({ runtimeName: "HighValue", name: [{ code: "en-US", content: "High value" }], description: [{ code: "en-US", content: "The upper bound for BETWEEN." }], optional: true })
export class HubSpotCreateSearchFilterFunction {
    run(_context: unknown, PropertyName: string, Operator: string, Value?: string, Values?: string[], HighValue?: string): HubSpotSearchFilter {
        const operator = (Operator ?? "").toUpperCase();
        if (!(HUBSPOT_FILTER_OPERATORS as readonly string[]).includes(operator)) {
            throw new RuntimeError(
                "INVALID_HUBSPOT_SEARCH_FILTER",
                `Unknown operator "${Operator}". Use one of: ${HUBSPOT_FILTER_OPERATORS.join(", ")}.`
            );
        }
        if (["IN", "NOT_IN"].includes(operator) && !(Values && Values.length)) {
            throw new RuntimeError("INVALID_HUBSPOT_SEARCH_FILTER", `${operator} needs at least one entry in Values.`);
        }
        if (operator === "BETWEEN" && (Value === undefined || HighValue === undefined)) {
            throw new RuntimeError("INVALID_HUBSPOT_SEARCH_FILTER", "BETWEEN needs Value and HighValue.");
        }
        return HubSpotSearchFilterSchema.parse({
            propertyName: PropertyName,
            operator,
            ...(Value !== undefined && Value !== null ? { value: String(Value) } : {}),
            ...(Values && Values.length ? { values: Values.map(String) } : {}),
            ...(HighValue !== undefined && HighValue !== null ? { highValue: String(HighValue) } : {}),
        });
    }
}
