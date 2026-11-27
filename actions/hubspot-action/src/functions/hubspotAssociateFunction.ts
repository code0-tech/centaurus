import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { associate } from "../helpers.js";
import { HubSpotAssociation } from "../data_types/hubspotAssociation.js";

@Identifier("hubspotAssociate")
@DisplayIcon("simple:hubspot")
@Signature("(AccessToken: string, FromObjectType: string, FromId: string, ToObjectType: string, ToId: string, AssociationType?: HUBSPOT_ASSOCIATION): BOOLEAN")
@Name({ code: "en-US", content: "Associate objects" })
@DisplayMessage({ code: "en-US", content: "Associate HubSpot ${FromObjectType} ${FromId} with ${ToObjectType} ${ToId}" })
@Documentation({ code: "en-US", content: "Associates two HubSpot CRM objects (e.g. a contact with a deal or company) using the v4 associations API. Without an association type the default association between the two object types is created; pass one (see Create association type) to use a specific type or custom label." })
@Description({ code: "en-US", content: "Associates two HubSpot CRM objects." })
@Parameter({ runtimeName: "AccessToken", name: [{ code: "en-US", content: "Access token" }], description: [{ code: "en-US", content: "Private-app access token (Bearer) of the HubSpot account to use." }] })
@Parameter({ runtimeName: "FromObjectType", name: [{ code: "en-US", content: "From object type" }], description: [{ code: "en-US", content: "The source object type (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "FromId", name: [{ code: "en-US", content: "From id" }], description: [{ code: "en-US", content: "The source object id." }] })
@Parameter({ runtimeName: "ToObjectType", name: [{ code: "en-US", content: "To object type" }], description: [{ code: "en-US", content: "The target object type (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "ToId", name: [{ code: "en-US", content: "To id" }], description: [{ code: "en-US", content: "The target object id." }] })
@Parameter({ runtimeName: "AssociationType", name: [{ code: "en-US", content: "Association type" }], description: [{ code: "en-US", content: "Optional association type or label. Leave empty for the default association." }], optional: true })
export class HubSpotAssociateFunction {
    async run(_context: FunctionContext, AccessToken: string, FromObjectType: string, FromId: string, ToObjectType: string, ToId: string, AssociationType?: HubSpotAssociation): Promise<boolean> {
        try {
            return await associate(FromObjectType, FromId, ToObjectType, ToId, AssociationType, AccessToken);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_ASSOCIATING_HUBSPOT_OBJECTS", error instanceof Error ? error.message : "unknown error");
        }
    }
}
