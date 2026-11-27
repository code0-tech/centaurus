import {
    Description, DisplayIcon, DisplayMessage, Documentation,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { HubSpotAssociation, HubSpotAssociationSchema } from "../../data_types/hubspotAssociation.js";

@Identifier("hubspotCreateAssociationType")
@DisplayIcon("simple:hubspot")
@Signature("(AssociationTypeId: number, AssociationCategory?: string): HUBSPOT_ASSOCIATION")
@Name({ code: "en-US", content: "Create association type" })
@DisplayMessage({ code: "en-US", content: "Create HubSpot association type ${AssociationTypeId}" })
@Documentation({ code: "en-US", content: "Builds a HubSpot association type (`HUBSPOT_ASSOCIATION`) for Associate objects. Category is HUBSPOT_DEFINED (default) for built-in types, or USER_DEFINED / INTEGRATOR_DEFINED for custom association labels. The type ids are listed in the HubSpot associations API docs." })
@Description({ code: "en-US", content: "Creates a HubSpot association type." })
@Parameter({ runtimeName: "AssociationTypeId", name: [{ code: "en-US", content: "Association type id" }], description: [{ code: "en-US", content: "The numeric association type id, e.g. 3 for deal to contact." }] })
@Parameter({ runtimeName: "AssociationCategory", name: [{ code: "en-US", content: "Category" }], description: [{ code: "en-US", content: "HUBSPOT_DEFINED (default), USER_DEFINED or INTEGRATOR_DEFINED." }], optional: true })
export class HubSpotCreateAssociationTypeFunction {
    run(_context: unknown, AssociationTypeId: number, AssociationCategory?: string): HubSpotAssociation {
        const parsed = HubSpotAssociationSchema.safeParse({
            associationCategory: (AssociationCategory || "HUBSPOT_DEFINED").toUpperCase(),
            associationTypeId: Number(AssociationTypeId),
        });
        if (!parsed.success || !Number.isInteger(parsed.data.associationTypeId)) {
            throw new RuntimeError(
                "INVALID_HUBSPOT_ASSOCIATION_TYPE",
                "Use an integer association type id and a category of HUBSPOT_DEFINED, USER_DEFINED or INTEGRATOR_DEFINED."
            );
        }
        return parsed.data;
    }
}
