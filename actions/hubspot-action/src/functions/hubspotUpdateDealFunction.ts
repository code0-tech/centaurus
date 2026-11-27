import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { updateDeal, PropertiesInput } from "../helpers.js";
import { HubSpotDeal } from "../data_types/hubspotDeal.js";

@Identifier("hubspotUpdateDeal")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, DealId: string, Properties: HUBSPOT_PROPERTY_MAP): HUBSPOT_DEAL")
@Name({ code: "en-US", content: "Update deal" })
@DisplayMessage({ code: "en-US", content: "Update HubSpot deal ${DealId}" })
@Documentation({ code: "en-US", content: "Updates an existing HubSpot deal. Provide the properties to change (e.g. dealstage, amount) as a property map." })
@Description({ code: "en-US", content: "Updates an existing HubSpot deal." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "DealId", name: [{ code: "en-US", content: "Deal id" }], description: [{ code: "en-US", content: "The HubSpot id of the deal to update." }] })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Property map (see Create property map) of HubSpot deal properties to set." }] })
export class HubSpotUpdateDealFunction {
    async run(_context: FunctionContext, AccessToken: string, DealId: string, Properties: PropertiesInput): Promise<HubSpotDeal> {
        try {
            return await updateDeal(DealId, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_UPDATING_HUBSPOT_DEAL", error instanceof Error ? error.message : "unknown error");
        }
    }
}
