import { RuntimeError } from "@code0-tech/hercules";
import { Client } from "@hubspot/api-client";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { HubSpotContact, HubSpotContactSchema } from "./data_types/hubspotContact.js";
import { HubSpotDeal, HubSpotDealSchema } from "./data_types/hubspotDeal.js";
import { HubSpotCompany, HubSpotCompanySchema } from "./data_types/hubspotCompany.js";
import { HubSpotNote, HubSpotNoteSchema } from "./data_types/hubspotNote.js";
import { HubSpotSearchResult, HubSpotSearchResultSchema } from "./data_types/hubspotSearchResult.js";
import { HubSpotAssociation, HubSpotAssociationSchema } from "./data_types/hubspotAssociation.js";
import { HubSpotSearchFilter, HubSpotSearchFilterSchema } from "./data_types/hubspotSearchFilter.js";
import { HubSpotPropertyMap } from "./data_types/hubspotPropertyMap.js";

/**
 * Extra properties as passed by a flow: normally a `HUBSPOT_PROPERTY_MAP`
 * object, but a JSON object string is accepted as well.
 */
export type PropertiesInput = HubSpotPropertyMap | Record<string, unknown> | string | null | undefined;

/**
 * Builds an authenticated HubSpot API client from the private-app access
 * token (Bearer) passed to the node. Every node brings its own token, so one
 * action instance can talk to any number of HubSpot accounts.
 */
export function getClient(accessToken: string): Client {
    const token = accessToken?.trim();
    if (!token) {
        throw new RuntimeError(
            "MISSING_HUBSPOT_ACCESS_TOKEN",
            "No HubSpot access token was given."
        );
    }
    return new Client({ accessToken: token });
}

/**
 * Normalises extra properties into a flat HubSpot property map. HubSpot CRM
 * properties are a dynamic bag of key/value pairs, so functions accept them as
 * a `HUBSPOT_PROPERTY_MAP` (see `hubspotCreatePropertyMap`) or, for
 * convenience, a JSON object string (e.g. `{"firstname":"Ada"}`). Values are
 * coerced to strings, which is what the HubSpot API expects.
 */
export function parseProperties(
    input: PropertiesInput,
    field = "properties"
): Record<string, string> {
    if (input === null || input === undefined) return {};
    let parsed: unknown = input;
    if (typeof input === "string") {
        if (input.trim() === "") return {};
        try {
            parsed = JSON.parse(input);
        } catch {
            throw new RuntimeError(
                "INVALID_HUBSPOT_PROPERTIES",
                `The ${field} value must be a property map or a valid JSON object string.`
            );
        }
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new RuntimeError(
            "INVALID_HUBSPOT_PROPERTIES",
            `The ${field} value must be an object of property name/value pairs.`
        );
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (value === null || value === undefined) continue;
        out[key] = typeof value === "string" ? value : String(value);
    }
    return out;
}

/** Builds a property map from two parallel lists of property names and values. */
export function createPropertyMap(names: string[], values: string[]): HubSpotPropertyMap {
    if (!Array.isArray(names) || !Array.isArray(values)) {
        throw new RuntimeError("INVALID_HUBSPOT_PROPERTIES", "Names and values must be lists.");
    }
    if (names.length !== values.length) {
        throw new RuntimeError(
            "INVALID_HUBSPOT_PROPERTIES",
            `Got ${names.length} property names but ${values.length} values; both lists must have the same length.`
        );
    }
    const out: HubSpotPropertyMap = {};
    names.forEach((name, i) => {
        if (!name) {
            throw new RuntimeError("INVALID_HUBSPOT_PROPERTIES", `Property name at position ${i} is empty.`);
        }
        const value = values[i];
        out[name] = value === null || value === undefined ? "" : String(value);
    });
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
export function throwHubSpotError(error: unknown, code: string, context?: string): never {
    const anyErr = error as { code?: number; body?: unknown; message?: string };
    const status = anyErr?.code;
    const detail =
        (anyErr?.body && typeof anyErr.body === "object"
            ? JSON.stringify(anyErr.body)
            : anyErr?.message) ?? "unknown error";
    console.error("HubSpot API error:", status, detail);
    const prefix = context ? `${context}. ` : "";
    throw new RuntimeError(code, `${prefix}HubSpot API error ${status ?? ""}: ${detail}`);
}

export async function createContact(
    email: string,
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotContact> {
    const client = getClient(accessToken);
    const props = { email, ...parseProperties(properties) };
    try {
        // `any` on the request payload only: the SDK's create input type is
        // version-specific; the response is validated with zod below.
        const res = await client.crm.contacts.basicApi.create({ properties: props, associations: [] } as any);
        return HubSpotContactSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_CONTACT");
    }
}

export async function updateContact(
    contactId: string,
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotContact> {
    const client = getClient(accessToken);
    const props = parseProperties(properties);
    try {
        const res = await client.crm.contacts.basicApi.update(contactId, { properties: props } as any);
        return HubSpotContactSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_UPDATING_HUBSPOT_CONTACT");
    }
}

export async function getContactByEmail(
    email: string,
    accessToken: string
): Promise<HubSpotContact> {
    const client = getClient(accessToken);
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
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotDeal> {
    const client = getClient(accessToken);
    const props: Record<string, string> = {
        dealname: name,
        pipeline,
        dealstage: stage,
        ...(amount ? { amount } : {}),
        ...parseProperties(properties),
    };
    try {
        const res = await client.crm.deals.basicApi.create({ properties: props, associations: [] } as any);
        return HubSpotDealSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_DEAL");
    }
}

export async function updateDeal(
    dealId: string,
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotDeal> {
    const client = getClient(accessToken);
    const props = parseProperties(properties);
    try {
        const res = await client.crm.deals.basicApi.update(dealId, { properties: props } as any);
        return HubSpotDealSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_UPDATING_HUBSPOT_DEAL");
    }
}

export async function createCompany(
    name: string,
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotCompany> {
    const client = getClient(accessToken);
    const props = { name, ...parseProperties(properties) };
    try {
        const res = await client.crm.companies.basicApi.create({ properties: props, associations: [] } as any);
        return HubSpotCompanySchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_COMPANY");
    }
}

/**
 * Creates a note and attaches it to a CRM object (contact, deal, company, ...)
 * via the default note association for that object type.
 */
export async function addNote(
    objectType: string,
    objectId: string,
    body: string,
    properties: PropertiesInput,
    accessToken: string
): Promise<HubSpotNote> {
    const client = getClient(accessToken);
    const props: Record<string, string> = {
        hs_note_body: body,
        hs_timestamp: new Date().toISOString(),
        ...parseProperties(properties),
    };
    let note: HubSpotNote;
    try {
        const res = await client.crm.objects.notes.basicApi.create({ properties: props, associations: [] } as any);
        note = HubSpotNoteSchema.parse(toPlainObject(res));
    } catch (error) {
        throwHubSpotError(error, "ERROR_CREATING_HUBSPOT_NOTE");
    }
    try {
        await client.crm.associations.v4.basicApi.createDefault("notes", note.id, objectType, objectId);
    } catch (error) {
        throwHubSpotError(
            error,
            "ERROR_ASSOCIATING_HUBSPOT_NOTE",
            `Note ${note.id} was created but could not be attached to ${objectType} ${objectId}`
        );
    }
    return note;
}

export async function associate(
    fromObjectType: string,
    fromId: string,
    toObjectType: string,
    toId: string,
    associationType: HubSpotAssociation | null | undefined,
    accessToken: string
): Promise<boolean> {
    const client = getClient(accessToken);
    let spec: HubSpotAssociation | undefined;
    if (associationType) {
        const parsed = HubSpotAssociationSchema.safeParse(associationType);
        if (!parsed.success) {
            throw new RuntimeError(
                "INVALID_HUBSPOT_ASSOCIATION_TYPE",
                "The association type needs an associationCategory and a numeric associationTypeId."
            );
        }
        spec = parsed.data;
    }
    try {
        if (spec) {
            // Explicit association type / label (v4 associations API).
            await client.crm.associations.v4.basicApi.create(
                fromObjectType,
                fromId,
                toObjectType,
                toId,
                [spec] as any
            );
        } else {
            // Default association between the two object types, which avoids
            // hard-coding association type ids.
            await client.crm.associations.v4.basicApi.createDefault(
                fromObjectType,
                fromId,
                toObjectType,
                toId
            );
        }
        return true;
    } catch (error) {
        throwHubSpotError(error, "ERROR_ASSOCIATING_HUBSPOT_OBJECTS");
    }
}

/**
 * Searches a CRM object type via the CRM search API. All filters are combined
 * with AND (one filter group); `query` optionally adds a full-text search.
 */
export async function searchObjects(
    objectType: string,
    filters: HubSpotSearchFilter[] | null | undefined,
    query: string | undefined,
    properties: string[] | undefined,
    limit: number | undefined,
    accessToken: string
): Promise<HubSpotSearchResult> {
    const parsedFilters: HubSpotSearchFilter[] = [];
    for (const filter of filters ?? []) {
        const parsed = HubSpotSearchFilterSchema.safeParse(filter);
        if (!parsed.success) {
            throw new RuntimeError(
                "INVALID_HUBSPOT_SEARCH_FILTER",
                "Every filter needs a propertyName and a valid operator (build them with hubspotCreateSearchFilter)."
            );
        }
        parsedFilters.push(parsed.data);
    }
    if (parsedFilters.length === 0 && !query) {
        throw new RuntimeError("INVALID_HUBSPOT_SEARCH_FILTER", "Provide at least one filter or a query.");
    }
    const searchRequest: any = {
        filterGroups: parsedFilters.length ? [{ filters: parsedFilters }] : [],
        // The CRM search API returns at most 200 results per page.
        limit: Math.min(Math.max(Math.trunc(limit ?? 25), 1), 200),
    };
    if (query) searchRequest.query = query;
    if (properties && properties.length) searchRequest.properties = properties;

    const client = getClient(accessToken);
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

/** Max age of a v3 signed request before it is rejected (HubSpot uses 5 minutes). */
const MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000;

function safeEqual(a: string, b: string): boolean {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function headerValue(headers: Record<string, unknown> | null | undefined, name: string): string | undefined {
    if (!headers) return undefined;
    const key = Object.keys(headers).find((k) => k.toLowerCase() === name);
    const value = key === undefined ? undefined : headers[key];
    if (Array.isArray(value)) return value[0] === undefined ? undefined : String(value[0]);
    return value === undefined || value === null ? undefined : String(value);
}

/** HubSpot decodes these URL-encoded characters before signing a v3 request. */
const V3_DECODED: Record<string, string> = {
    "%3A": ":", "%2F": "/", "%3F": "?", "%40": "@", "%21": "!", "%24": "$",
    "%27": "'", "%28": "(", "%29": ")", "%2A": "*", "%2C": ",", "%3B": ";",
};

function decodeV3Uri(uri: string): string {
    return uri.replace(/%(3A|2F|3F|40|21|24|27|28|29|2A|2C|3B)/gi, (m) => V3_DECODED[m.toUpperCase()]);
}

/**
 * Verifies the signature HubSpot puts on webhook requests, using the app's
 * client secret. Supports v3 (`X-HubSpot-Signature-v3`, preferred) as well as
 * v1/v2 (`X-HubSpot-Signature` + `X-HubSpot-Signature-Version`).
 *
 * The webhook trigger hands the flow the parsed body, not the raw bytes, so a
 * non-string payload is re-serialised with `JSON.stringify`. That matches
 * HubSpot's compact JSON; a body formatted differently fails verification.
 * v2 and v3 also sign the request URL, so `requestUrl` must be the exact public
 * URL HubSpot called (including the query string).
 * See https://developers.hubspot.com/docs/api/webhooks/validating-requests
 */
export function verifyWebhookSignature(
    clientSecret: string,
    headers: Record<string, unknown> | null | undefined,
    payload: unknown,
    method: string | undefined,
    requestUrl: string | undefined,
    now: number = Date.now()
): boolean {
    const body = typeof payload === "string" ? payload : JSON.stringify(payload ?? "");
    const httpMethod = (method || "POST").toUpperCase();

    const v3 = headerValue(headers, "x-hubspot-signature-v3");
    if (v3) {
        const timestamp = headerValue(headers, "x-hubspot-request-timestamp");
        if (!timestamp || !requestUrl) {
            throw new RuntimeError(
                "INVALID_HUBSPOT_SIGNATURE_INPUT",
                "v3 signatures need the X-HubSpot-Request-Timestamp header and the request URL."
            );
        }
        if (!(Math.abs(now - Number(timestamp)) <= MAX_SIGNATURE_AGE_MS)) return false;
        const expected = createHmac("sha256", clientSecret)
            .update(httpMethod + decodeV3Uri(requestUrl) + body + timestamp, "utf8")
            .digest("base64");
        return safeEqual(expected, v3);
    }

    const signature = headerValue(headers, "x-hubspot-signature");
    if (!signature) return false;
    const version = (headerValue(headers, "x-hubspot-signature-version") ?? "v1").toLowerCase();
    let source: string;
    if (version === "v1") {
        source = clientSecret + body;
    } else if (version === "v2") {
        if (!requestUrl) {
            throw new RuntimeError("INVALID_HUBSPOT_SIGNATURE_INPUT", "v2 signatures need the request URL.");
        }
        source = clientSecret + httpMethod + requestUrl + body;
    } else {
        return false;
    }
    const expected = createHash("sha256").update(source, "utf8").digest("hex");
    return safeEqual(expected, signature.toLowerCase());
}
