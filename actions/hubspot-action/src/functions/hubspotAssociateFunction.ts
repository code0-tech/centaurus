import {
    Description, DisplayIcon, DisplayMessage, Documentation, FunctionContext,
    Identifier, Name, Parameter, RuntimeError, Signature,
} from "@code0-tech/hercules";
import { associate } from "../helpers.js";

@Identifier("hubspotAssociate")
@DisplayIcon("simple:hubspot")
@Signature("(FromObjectType: string, FromId: string, ToObjectType: string, ToId: string): BOOLEAN")
@Name({ code: "en-US", content: "Associate objects" })
@DisplayMessage({ code: "en-US", content: "Associate HubSpot ${FromObjectType} ${FromId} with ${ToObjectType} ${ToId}" })
@Documentation({ code: "en-US", content: "Creates the default association between two HubSpot CRM objects (e.g. contact and deal) using the v4 associations API." })
@Description({ code: "en-US", content: "Associates two HubSpot CRM objects." })
@Parameter({ runtimeName: "FromObjectType", name: [{ code: "en-US", content: "From object type" }], description: [{ code: "en-US", content: "The source object type (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "FromId", name: [{ code: "en-US", content: "From id" }], description: [{ code: "en-US", content: "The source object id." }] })
@Parameter({ runtimeName: "ToObjectType", name: [{ code: "en-US", content: "To object type" }], description: [{ code: "en-US", content: "The target object type (e.g. contacts, deals, companies)." }] })
@Parameter({ runtimeName: "ToId", name: [{ code: "en-US", content: "To id" }], description: [{ code: "en-US", content: "The target object id." }] })
export class HubSpotAssociateFunction {
    async run(context: FunctionContext, FromObjectType: string, FromId: string, ToObjectType: string, ToId: string): Promise<boolean> {
        try {
            return await associate(FromObjectType, FromId, ToObjectType, ToId, context);
        } catch (error) {
            if (error instanceof RuntimeError) throw error;
            throw new RuntimeError("ERROR_ASSOCIATING_HUBSPOT_OBJECTS", error instanceof Error ? error.message : "unknown error");
        }
    }
}
