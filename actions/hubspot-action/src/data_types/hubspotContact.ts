import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { hubSpotObjectSchema } from "./hubspotObjectBase.js";

export const HubSpotContactSchema = hubSpotObjectSchema();
export type HubSpotContact = z.infer<typeof HubSpotContactSchema>;

@Identifier("HUBSPOT_CONTACT")
@Name({ code: "en-US", content: "HubSpot contact" })
@DisplayMessage({ code: "en-US", content: "HubSpot contact" })
@Schema(HubSpotContactSchema)
export class HubSpotContactDataType {}
