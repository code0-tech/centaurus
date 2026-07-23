import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { hubSpotObjectSchema } from "./hubspotObjectBase.js";

export const HubSpotNoteSchema = hubSpotObjectSchema();
export type HubSpotNote = z.infer<typeof HubSpotNoteSchema>;

@Identifier("HUBSPOT_NOTE")
@Name({ code: "en-US", content: "HubSpot note" })
@DisplayMessage({ code: "en-US", content: "HubSpot note" })
@Schema(HubSpotNoteSchema)
export class HubSpotNoteDataType {}
