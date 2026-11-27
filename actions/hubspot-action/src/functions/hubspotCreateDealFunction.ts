import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { createDeal, PropertiesInput } from "../helpers.js";
import { HubSpotDeal } from "../data_types/hubspotDeal.js";

@Identifier("hubspotCreateDeal")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, Name: string, Pipeline: string, Stage: string, Amount?: string, Properties?: HUBSPOT_PROPERTY_MAP): HUBSPOT_DEAL")
@Name({ code: "en-US", content: "Create deal" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot deal ${Name}" })
@Documentation({ code: "en-US", content: "Creates a new HubSpot deal in the given pipeline and stage. Amount and extra properties are optional." })
@Description({ code: "en-US", content: "Creates a new HubSpot deal." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "Name", name: [{ code: "en-US", content: "Name" }], description: [{ code: "en-US", content: "The deal name (dealname)." }] })
@Parameter({ runtimeName: "Pipeline", name: [{ code: "en-US", content: "Pipeline" }], description: [{ code: "en-US", content: "The pipeline id the deal belongs to." }] })
@Parameter({ runtimeName: "Stage", name: [{ code: "en-US", content: "Stage" }], description: [{ code: "en-US", content: "The deal stage id (dealstage)." }] })
@Parameter({ runtimeName: "Amount", name: [{ code: "en-US", content: "Amount" }], description: [{ code: "en-US", content: "Optional deal amount." }], optional: true })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Optional property map (see Create property map) of additional deal properties." }], optional: true })
export class HubSpotCreateDealFunction {
    async run(_context: FunctionContext, AccessToken: string, Name: string, Pipeline: string, Stage: string, Amount?: string, Properties?: PropertiesInput): Promise<HubSpotDeal> {
        try {
            return await createDeal(Name, Pipeline, Stage, Amount, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_DEAL", error instanceof Error ? error.message : "unknown error");
        }
    }
}
