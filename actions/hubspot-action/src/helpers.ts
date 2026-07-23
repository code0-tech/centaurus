import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import { Client } from "@hubspot/api-client";
import { HubSpotContact, HubSpotContactSchema } from "./data_types/hubspotContact.js";
import { HubSpotDeal, HubSpotDealSchema } from "./data_types/hubspotDeal.js";
import { HubSpotCompany, HubSpotCompanySchema } from "./data_types/hubspotCompany.js";
import { HubSpotNote, HubSpotNoteSchema } from "./data_types/hubspotNote.js";
import { HubSpotSearchResult, HubSpotSearchResultSchema } from "./data_types/hubspotSearchResult.js";

/**
 * Builds an authenticated HubSpot API client from the action config. Uses a
 * private-app access token (Bearer) as configured on the action.
 */
export function getClient(context: FunctionContext): Client {
    const accessToken = context.matchedConfig.findConfig("access_token") as string;
    if (!accessToken) {
        throw new RuntimeError(
            "MISSING_HUBSPOT_ACCESS_TOKEN",
            "A HubSpot access_token must be configured for this action."
        );
    }
    return new Client({ accessToken });
}

/**
 * Parses a JSON object string into a flat HubSpot property map. HubSpot CRM
 * properties are a dynamic bag of key/value pairs, so functions accept them as
 * a JSON object string (e.g. `{"firstname":"Ada","lifecyclestage":"lead"}`)
 * rather than a fixed set of typed parameters. Values are coerced to strings,
 * which is what the HubSpot API expects.
 */
export function parseProperties(
    json: string | undefined,
    field = "properties"
): Record<string, string> {
    if (!json || json.trim() === "") return {};
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        throw new RuntimeError(
            "INVALID_HUBSPOT_PROPERTIES",
            `The ${field} value must be a valid JSON object string.`
        );
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new RuntimeError(
            "INVALID_HUBSPOT_PROPERTIES",
            `The ${field} value must be a JSON object of property name/value pairs.`
        );
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value === null || value === undefined) continue;
        out[key] = typeof value === "string" ? value : String(value);
    }
    return out;
}

/**
 * Normalises the SDK's `SimplePublicObject` (Date timestamps, optional fields)
 * into the plain shape expected by the zod object schemas.
 */
function toPlainObject(obj: {
    id: string;
    properties: { [key: string]: string | null } | Record<string, string>;
    createdAt?: Date;
    updatedAt?: Date;
    archived?: boolean;
}) {
    return {
        id: obj.id,
        properties: obj.properties ?? {},
        createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : null,
        updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : null,
        archived: obj.archived ?? null,
    };
}

/** Maps a HubSpot SDK/ApiException error into a stable RuntimeError. */
export function throwHubSpotError(error: unknown, code: string): never {
    const anyErr = error as { code?: number; body?: unknown; message?: string };
    const status = anyErr?.code;
    const detail =
        (anyErr?.body && typeof anyErr.body === "object"
            ? JSON.stringify(anyErr.body)
            : anyErr?.message) ?? "unknown error";
    console.error("HubSpot API error:", status, detail);
    throw new RuntimeError(code, `HubSpot API error ${status ?? ""}: ${detail}`);
}

export async function createContact(
    email: string,
    propertiesJson: string | undefined,
    context: FunctionContext
): Promise<HubSpotContact> {
    const client = getClient(context);
    const properties = { email, ...parseProperties(propertiesJson) };
    try {
        // `any` on the request payload only: the SDK's create input type is
        // version-specific; the response is validated with zod below.
        const res = await client.crm.contacts.basicApi.create({ properties, associations: [] } as any);
        return HubSpotContactSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_CONTACT");
    }
}

export async function updateContact(
    contactId: string,
    propertiesJson: string,
    context: FunctionContext
): Promise<HubSpotContact> {
    const client = getClient(context);
    const properties = parseProperties(propertiesJson);
    try {
        const res = await client.crm.contacts.basicApi.update(contactId, { properties } as any);
        return HubSpotContactSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_UPDATING_HUBSPOT_CONTACT");
    }
}

export async function getContactByEmail(
    email: string,
    context: FunctionContext
): Promise<HubSpotContact> {
    const client = getClient(context);
    const searchRequest: any = {
        filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: email }] }],
        properties: ["email", "firstname", "lastname", "lifecyclestage"],
        limit: 1,
    };
    try {
        const res = await client.crm.contacts.searchApi.doSearch(searchRequest);
        const first = res.results?.[0];
        if (!first) {
            throw new RuntimeError(
                "HUBSPOT_CONTACT_NOT_FOUND",
                `No HubSpot contact found with email ${email}.`
            );
        }
        return HubSpotContactSchema.parse(toPlainObject(first));
    } catch (error) {
        if (error instanceof RuntimeError) throw error;
        throwHubSpotError(error, "ERROR_SEARCHING_HUBSPOT_CONTACT");
    }
}

export async function createDeal(
    name: string,
    pipeline: string,
    stage: string,
    amount: string | undefined,
    propertiesJson: string | undefined,
    context: FunctionContext
): Promise<HubSpotDeal> {
    const client = getClient(context);
    const properties: Record<string, string> = {
        dealname: name,
        pipeline,
        dealstage: stage,
        ...(amount ? { amount } : {}),
        ...parseProperties(propertiesJson),
    };
    try {
        const res = await client.crm.deals.basicApi.create({ properties, associations: [] } as any);
        return HubSpotDealSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_DEAL");
    }
}

export async function updateDeal(
    dealId: string,
    propertiesJson: string,
    context: FunctionContext
): Promise<HubSpotDeal> {
    const client = getClient(context);
    const properties = parseProperties(propertiesJson);
    try {
        const res = await client.crm.deals.basicApi.update(dealId, { properties } as any);
        return HubSpotDealSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_UPDATING_HUBSPOT_DEAL");
    }
}

export async function createCompany(
    name: string,
    propertiesJson: string | undefined,
    context: FunctionContext
): Promise<HubSpotCompany> {
    const client = getClient(context);
    const properties = { name, ...parseProperties(propertiesJson) };
    try {
        const res = await client.crm.companies.basicApi.create({ properties, associations: [] } as any);
        return HubSpotCompanySchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_COMPANY");
    }
}

export async function addNote(
    body: string,
    propertiesJson: string | undefined,
    context: FunctionContext
): Promise<HubSpotNote> {
    const client = getClient(context);
    const properties: Record<string, string> = {
        hs_note_body: body,
        hs_timestamp: new Date().toISOString(),
        ...parseProperties(propertiesJson),
    };
    try {
        const res = await client.crm.objects.notes.basicApi.create({ properties, associations: [] } as any);
        return HubSpotNoteSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_NOTE");
    }
}

export async function associate(
    fromObjectType: string,
    fromId: string,
    toObjectType: string,
    toId: string,
    context: FunctionContext
): Promise<boolean> {
    const client = getClient(context);
    try {
        // Uses the default association between the two object types (v4
        // associations API), which avoids hard-coding version-specific
        // association type ids.
        await client.crm.associations.v4.basicApi.createDefault(
            fromObjectType,
            fromId,
            toObjectType,
            toId
        );
        return true;
    } catch (error) {
        throwHubSpotError(error, "ERROR_ASSOCIATING_HUBSPOT_OBJECTS");
    }
}

export async function searchObjects(
    objectType: string,
    query: string,
    context: FunctionContext
): Promise<HubSpotSearchResult> {
    const client = getClient(context);
    const searchRequest: any = { query, limit: 25 };
    try {
        const res = await client.crm.objects.searchApi.doSearch(objectType, searchRequest);
        return HubSpotSearchResultSchema.parse({
            total: res.total ?? res.results?.length ?? 0,
            results: (res.results ?? []).map((r: any) => toPlainObject(r)),
        });
    } catch (error) {
        throwHubSpotError(error, "ERROR_SEARCHING_HUBSPOT_OBJECTS");
    }
}
