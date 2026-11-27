import {
    Description, DisplayIcon, DisplayMessage, Documentation,
    Identifier, Name, Parameter, Signature,
} from "@code0-tech/hercules";
import { createPropertyMap } from "../../helpers.js";
import { HubSpotPropertyMap } from "../../data_types/hubspotPropertyMap.js";

@Identifier("hubspotCreatePropertyMap")
@DisplayIcon("simple:hubspot")
@Signature("(Names: LIST<TEXT>, Values: LIST<TEXT>): HUBSPOT_PROPERTY_MAP")
@Name({ code: "en-US", content: "Create property map" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot property map" })
@Documentation({ code: "en-US", content: "Builds a HubSpot property map (`HUBSPOT_PROPERTY_MAP`) from a list of internal property names (e.g. firstname, lifecyclestage) and a list of values at the same positions. Use it for the Properties parameter of the create/update functions." })
@Description({ code: "en-US", content: "Creates a HubSpot property map." })
@Parameter({ runtimeName: "Names", name: [{ code: "en-US", content: "Names" }], description: [{ code: "en-US", content: "The internal HubSpot property names." }] })
@Parameter({ runtimeName: "Values", name: [{ code: "en-US", content: "Values" }], description: [{ code: "en-US", content: "The values, in the same order as the names." }] })
export class HubSpotCreatePropertyMapFunction {
    run(_context: unknown, Names: string[], Values: string[]): HubSpotPropertyMap {
        return createPropertyMap(Names, Values);
    }
}
