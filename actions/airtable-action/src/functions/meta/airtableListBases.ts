import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { airtableRequest } from "../../client.js";
import { handleAirtableError } from "../../helpers.js";
import { AirtableBaseType } from "../../data_types/airtableBase.js";
import { API_TOKEN_PARAMETER } from "../parameters.js";

@Identifier("airtableListBases")
@Signature("(apiToken: string): AIRTABLE_BASE[]")
@Name({ code: "en-US", content: "List bases" })
@DisplayIcon("simple:airtable")
@DisplayMessage({ code: "en-US", content: "List Airtable bases" })
@Documentation({
    code: "en-US",
    content: "Lists every base the personal access token can access. Needs the `schema.bases:read` scope.",
})
@Description({ code: "en-US", content: "List the bases the token can access." })
@Parameter(API_TOKEN_PARAMETER)
export class AirtableListBasesFunction {
    async run(_context: unknown, apiToken: string): Promise<AirtableBaseType[]> {
        try {
            const bases: AirtableBaseType[] = [];
            let offset: string | undefined;

            do {
                const page = await airtableRequest<{ bases: AirtableBaseType[]; offset?: string }>(
                    apiToken,
                    "/meta/bases",
                    { query: { offset } }
                );
                bases.push(
                    ...(page.bases ?? []).map((base) => ({
                        id: base.id,
                        name: base.name,
                        permissionLevel: base.permissionLevel,
                    }))
                );
                offset = page.offset;
            } while (offset);

            return bases;
        } catch (error) {
            return handleAirtableError(error, "AIRTABLE_LIST_BASES_FAILED", "Failed to list the Airtable bases.");
        }
    }
}
