import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { addNote, PropertiesInput } from "../helpers.js";
import { HubSpotNote } from "../data_types/hubspotNote.js";

@Identifier("hubspotAddNote")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, ObjectType: string, ObjectId: string, Body: string, Properties?: HUBSPOT_PROPERTY_MAP): HUBSPOT_NOTE")
@Name({ code: "en-US", content: "Add note" })
@DisplayMessage({ code: "en-US", content: "Add HubSpot note to ${ObjectType} ${ObjectId}" })
@Documentation({ code: "en-US", content: "Creates a HubSpot note with the given body and attaches it to a CRM object (e.g. a contact, deal or company) using the default note association. The note timestamp defaults to now. Extra note properties may be passed as a property map." })
@Description({ code: "en-US", content: "Adds a note to a HubSpot CRM object." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "ObjectType", name: [{ code: "en-US", content: "Object type" }], description: [{ code: "en-US", content: "The type of the object to attach the note to (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "ObjectId", name: [{ code: "en-US", content: "Object id" }], description: [{ code: "en-US", content: "The id of the object to attach the note to." }] })
@Parameter({ runtimeName: "Body", name: [{ code: "en-US", content: "Body" }], description: [{ code: "en-US", content: "The note text (hs_note_body)." }] })
@Parameter({ runtimeName: "Properties", name: [{ code: "en-US", content: "Properties" }], description: [{ code: "en-US", content: "Optional property map (see Create property map) of additional note properties." }], optional: true })
export class HubSpotAddNoteFunction {
    async run(_context: FunctionContext, AccessToken: string, ObjectType: string, ObjectId: string, Body: string, Properties?: PropertiesInput): Promise<HubSpotNote> {
        try {
            return await addNote(ObjectType, ObjectId, Body, Properties, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_NOTE", error instanceof Error ? error.message : "unknown error");
        }
    }
}
