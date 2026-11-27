import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { createContact, PropertiesInput } from "../helpers.js";
import { HubSpotContact } from "../data_types/hubspotContact.js";

@Identifier("hubspotCreateContact")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, Email: string, Properties?: HUBSPOT_PROPERTY_MAP): HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "Create contact" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot contact ${Email}" })
@Documentation({ code: "en-US", content: "Creates a new contact in HubSpot with the given email. Pass additional properties as a property map (e.g. {\"firstname\":\"Ada\"})." })
@Description({ code: "en-US", content: "Creates a new HubSpot contact." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "Email", name: [{ code: "en-US", content: "Email" }], description: [{ code: "en-US", content: "The email address of the contact (used as the primary identifier)." }] })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Optional property map (see Create property map) of additional HubSpot contact properties." }], optional: true })
export class HubSpotCreateContactFunction {
    async run(_context: FunctionContext, AccessToken: string, Email: string, Properties?: PropertiesInput): Promise<HubSpotContact> {
        try {
            return await createContact(Email, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_CONTACT", error instanceof Error ? error.message : "unknown error");
        }
    }
}
