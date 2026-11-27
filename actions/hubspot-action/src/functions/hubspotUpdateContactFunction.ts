import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { updateContact, PropertiesInput } from "../helpers.js";
import { HubSpotContact } from "../data_types/hubspotContact.js";

@Identifier("hubspotUpdateContact")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, ContactId: string, Properties: HUBSPOT_PROPERTY_MAP): HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "Update contact" })
@DisplayMessage({ code: "en-US", content: "Update HubSpot contact ${ContactId}" })
@Documentation({ code: "en-US", content: "Updates an existing HubSpot contact. Provide the properties to change as a property map." })
@Description({ code: "en-US", content: "Updates an existing HubSpot contact." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "ContactId", name: [{ code: "en-US", content: "Contact id" }], description: [{ code: "en-US", content: "The HubSpot id of the contact to update." }] })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Property map (see Create property map) of HubSpot contact properties to set." }] })
export class HubSpotUpdateContactFunction {
    async run(_context: FunctionContext, AccessToken: string, ContactId: string, Properties: PropertiesInput): Promise<HubSpotContact> {
        try {
            return await updateContact(ContactId, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_UPDATING_HUBSPOT_CONTACT", error instanceof Error ? error.message : "unknown error");
        }
    }
}
