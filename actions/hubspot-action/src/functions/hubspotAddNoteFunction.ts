import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { addNote } from "../helpers.js";
import { HubSpotNote } from "../data_types/hubspotNote.js";

@Identifier("hubspotAddNote")
@DisplayIcon("simple:hubspot")
@Signature("(Body: string, PropertiesJson?: string): HUBSPOT_NOTE")
@Name({ code: "en-US", content: "Add note" })
@DisplayMessage({ code: "en-US", content: "Add HubSpot note" })
@Documentation({ code: "en-US", content: "Creates a HubSpot note engagement with the given body. The note timestamp defaults to now. Extra properties may be passed as a JSON object string." })
@Description({ code: "en-US", content: "Creates a HubSpot note." })
@Parameter({ runtimeName: "Body", name: [{ code: "en-US", content: "Body" }], description: [{ code: "en-US", content: "The note text (hs_note_body)." }] })
@Parameter({ runtimeName: "PropertiesJson", name: [{ code: "en-US", content: "Properties (JSON)" }], description: [{ code: "en-US", content: "Optional JSON object of additional note properties." }], optional: true })
export class HubSpotAddNoteFunction {
    async run(context: FunctionContext, Body: string, PropertiesJson?: string): Promise<HubSpotNote> {
        try {
            return await addNote(Body, PropertiesJson, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_CREATING_HUBSPOT_NOTE", error instanceof Error ? error.message : "unknown error");
        }
    }
}
