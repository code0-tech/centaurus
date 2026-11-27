import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";

/**
 * An association type (label) between two HubSpot CRM objects, as used by the
 * v4 associations API. `HUBSPOT_DEFINED` covers the built-in types (e.g. 3 =
 * deal to contact), `USER_DEFINED` covers custom association labels.
 * See https://developers.hubspot.com/docs/api/crm/associations
 */
export const HubSpotAssociationSchema = z.object({
    associationCategory: z
        .enum(["HUBSPOT_DEFINED", "USER_DEFINED", "INTEGRATOR_DEFINED"])
        .describe("Who defined the association type."),
    associationTypeId: z.number().describe("The numeric association type id."),
});
export type HubSpotAssociation = z.infer<typeof HubSpotAssociationSchema>;

@Identifier("HUBSPOT_ASSOCIATION")
@Name({ code: "en-US", content: "HubSpot association type" })
@DisplayMessage({ code: "en-US", content: "HubSpot association ${associationCategory} ${associationTypeId}" })
@Schema(HubSpotAssociationSchema)
export class HubSpotAssociationDataType {}
