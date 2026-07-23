import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { createContact } from "../helpers.js";
import { HubSpotContact } from "../data_types/hubspotContact.js";

@Identifier("hubspotCreateContact")
@DisplayIcon("simple:hubspot")
@Signature("(Email: string, PropertiesJson?: string): HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "Create contact" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot contact ${Email}" })
@Documentation({ code: "en-US", content: "Creates a new contact in HubSpot with the given email. Pass additional properties as a JSON object string (e.g. {\"firstname\":\"Ada\"})." })
@Description({ code: "en-US", content: "Creates a new HubSpot contact." })
@Parameter({ runtimeName: "Email", name: [{ code: "en-US", content: "Email" }], description: [{ code: "en-US", content: "The email address of the contact (used as the primary identifier)." }] })
@Parameter({ runtimeName: "PropertiesJson", name: [{ code: "en-US", content: "Properties (JSON)" }], description: [{ code: "en-US", content: "Optional JSON object of additional HubSpot contact properties." }], optional: true })
export class HubSpotCreateContactFunction {
    async run(context: FunctionContext, Email: string, PropertiesJson?: string): Promise<HubSpotContact> {
        try {
            return await createContact(Email, PropertiesJson, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_CONTACT", error instanceof Error ? error.message : "unknown error");
        }
    }
}
