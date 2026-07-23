import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { updateDeal } from "../helpers.js";
import { HubSpotDeal } from "../data_types/hubspotDeal.js";

@Identifier("hubspotUpdateDeal")
@DisplayIcon("simple:hubspot")
@Signature("(DealId: string, PropertiesJson: string): HUBSPOT_DEAL")
@Name({ code: "en-US", content: "Update deal" })
@DisplayMessage({ code: "en-US", content: "Update HubSpot deal ${DealId}" })
@Documentation({ code: "en-US", content: "Updates an existing HubSpot deal. Provide the properties to change (e.g. dealstage, amount) as a JSON object string." })
@Description({ code: "en-US", content: "Updates an existing HubSpot deal." })
@Parameter({ runtimeName: "DealId", name: [{ code: "en-US", content: "Deal id" }], description: [{ code: "en-US", content: "The HubSpot id of the deal to update." }] })
@Parameter({ runtimeName: "PropertiesJson", name: [{ code: "en-US", content: "Properties (JSON)" }], description: [{ code: "en-US", content: "JSON object of HubSpot deal properties to set." }] })
export class HubSpotUpdateDealFunction {
    async run(context: FunctionContext, DealId: string, PropertiesJson: string): Promise<HubSpotDeal> {
        try {
            return await updateDeal(DealId, PropertiesJson, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_UPDATING_HUBSPOT_DEAL", error instanceof Error ? error.message : "unknown error");
        }
    }
}
