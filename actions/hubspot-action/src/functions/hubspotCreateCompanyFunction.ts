import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { createCompany, PropertiesInput } from "../helpers.js";
import { HubSpotCompany } from "../data_types/hubspotCompany.js";

@Identifier("hubspotCreateCompany")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, Name: string, Properties?: HUBSPOT_PROPERTY_MAP): HUBSPOT_COMPANY")
@Name({ code: "en-US", content: "Create company" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot company ${Name}" })
@Documentation({ code: "en-US", content: "Creates a new HubSpot company. Pass additional properties (e.g. domain, industry) as a property map." })
@Description({ code: "en-US", content: "Creates a new HubSpot company." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "Name", name: [{ code: "en-US", content: "Name" }], description: [{ code: "en-US", content: "The company name." }] })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Optional property map (see Create property map) of additional company properties." }], optional: true })
export class HubSpotCreateCompanyFunction {
    async run(_context: FunctionContext, AccessToken: string, Name: string, Properties?: PropertiesInput): Promise<HubSpotCompany> {
        try {
            return await createCompany(Name, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_COMPANY", error instanceof Error ? error.message : "unknown error");
        }
    }
}
