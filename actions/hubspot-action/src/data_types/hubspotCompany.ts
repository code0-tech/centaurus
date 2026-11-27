import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { hubSpotObjectSchema } from "./hubspotObjectBase.js";

export const HubSpotCompanySchema = hubSpotObjectSchema();
export type HubSpotCompany = z.infer<typeof HubSpotCompanySchema>;

@Identifier("HUBSPOT_COMPANY")
@Name({ code: "en-US", content: "HubSpot company" })
@DisplayMessage({ code: "en-US", content: "HubSpot company" })
@Schema(HubSpotCompanySchema)
export class HubSpotCompanyDataType {}
