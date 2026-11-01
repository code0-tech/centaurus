import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { hubSpotObjectSchema } from "./hubspotObjectBase.js";

export const HubSpotDealSchema = hubSpotObjectSchema();
export type HubSpotDeal = z.infer<typeof HubSpotDealSchema>;

@Identifier("HUBSPOT_DEAL")
@Name({ code: "en-US", content: "HubSpot deal" })
@DisplayMessage({ code: "en-US", content: "HubSpot deal" })
@Schema(HubSpotDealSchema)
export class HubSpotDealDataType {}
