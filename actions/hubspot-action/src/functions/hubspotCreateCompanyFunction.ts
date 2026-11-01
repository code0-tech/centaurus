import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { createCompany } from "../helpers.js";
import { HubSpotCompany } from "../data_types/hubspotCompany.js";

@Identifier("hubspotCreateCompany")
@DisplayIcon("simple:hubspot")
@Signature("(Name: string, PropertiesJson?: string): HUBSPOT_COMPANY")
@Name({ code: "en-US", content: "Create company" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot company ${Name}" })
@Documentation({ code: "en-US", content: "Creates a new HubSpot company. Pass additional properties (e.g. domain, industry) as a JSON object string." })
@Description({ code: "en-US", content: "Creates a new HubSpot company." })
@Parameter({ runtimeName: "Name", name: [{ code: "en-US", content: "Name" }], description: [{ code: "en-US", content: "The company name." }] })
@Parameter({ runtimeName: "PropertiesJson", name: [{ code: "en-US", content: "Properties (JSON)" }], description: [{ code: "en-US", content: "Optional JSON object of additional company properties." }], optional: true })
export class HubSpotCreateCompanyFunction {
    async run(context: FunctionContext, Name: string, PropertiesJson?: string): Promise<HubSpotCompany> {
        try {
            return await createCompany(Name, PropertiesJson, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_COMPANY", error instanceof Error ? error.message : "unknown error");
        }
    }
}
