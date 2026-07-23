import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { getContactByEmail } from "../helpers.js";
import { HubSpotContact } from "../data_types/hubspotContact.js";

@Identifier("hubspotGetContactByEmail")
@DisplayIcon("simple:hubspot")
@Signature("(Email: string): HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "Get contact by email" })
@DisplayMessage({ code: "en-US", content: "Get HubSpot contact ${Email}" })
@Documentation({ code: "en-US", content: "Looks up a single HubSpot contact by email using the CRM search API. Fails if no contact matches." })
@Description({ code: "en-US", content: "Fetches a HubSpot contact by email." })
@Parameter({ runtimeName: "Email", name: [{ code: "en-US", content: "Email" }], description: [{ code: "en-US", content: "The email address to look up." }] })
export class HubSpotGetContactByEmailFunction {
    async run(context: FunctionContext, Email: string): Promise<HubSpotContact> {
        try {
            return await getContactByEmail(Email, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_SEARCHING_HUBSPOT_CONTACT", error instanceof Error ? error.message : "unknown error");
        }
    }
}
