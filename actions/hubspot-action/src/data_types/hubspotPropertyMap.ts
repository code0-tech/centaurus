import { Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * A flat map of HubSpot property names to values. HubSpot CRM properties are a
 * dynamic key/value bag, so create/update functions take one of these instead
 * of a fixed set of typed parameters. Build one with `hubspotCreatePropertyMap`.
 */
export const HubSpotPropertyMapSchema = z.record(z.string(), z.string());
export type HubSpotPropertyMap = z.infer<typeof HubSpotPropertyMapSchema>;

@Identifier("HUBSPOT_PROPERTY_MAP")
@Name({ code: "en-US", content: "HubSpot property map" })
@Schema(HubSpotPropertyMapSchema)
export class HubSpotPropertyMapDataType {}
