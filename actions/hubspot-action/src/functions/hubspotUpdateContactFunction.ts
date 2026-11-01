import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { updateContact } from "../helpers.js";
import { HubSpotContact } from "../data_types/hubspotContact.js";

@Identifier("hubspotUpdateContact")
@DisplayIcon("simple:hubspot")
@Signature("(ContactId: string, PropertiesJson: string): HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "Update contact" })
@DisplayMessage({ code: "en-US", content: "Update HubSpot contact ${ContactId}" })
@Documentation({ code: "en-US", content: "Updates an existing HubSpot contact. Provide the properties to change as a JSON object string." })
@Description({ code: "en-US", content: "Updates an existing HubSpot contact." })
@Parameter({ runtimeName: "ContactId", name: [{ code: "en-US", content: "Contact id" }], description: [{ code: "en-US", content: "The HubSpot id of the contact to update." }] })
@Parameter({ runtimeName: "PropertiesJson", name: [{ code: "en-US", content: "Properties (JSON)" }], description: [{ code: "en-US", content: "JSON object of HubSpot contact properties to set." }] })
export class HubSpotUpdateContactFunction {
    async run(context: FunctionContext, ContactId: string, PropertiesJson: string): Promise<HubSpotContact> {
        try {
            return await updateContact(ContactId, PropertiesJson, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_UPDATING_HUBSPOT_CONTACT", error instanceof Error ? error.message : "unknown error");
        }
    }
}
