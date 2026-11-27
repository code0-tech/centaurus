import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotContactCreatedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot contact created" })
@Description({ code: "en-US", content: "Triggered when a new contact is created in HubSpot (subscription type contact.creation)." })
@DisplayMessage({ code: "en-US", content: "HubSpot contact created on ${http_url}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: HubSpotContactCreatedWebhookPayload): REST_ADAPTER_INPUT<HubSpotContactCreatedWebhookPayload>")
@EventSetting({
    identifier: "input_schema",
    hidden: true
})
@EventSetting({
    identifier: "http_method",
    hidden: true,
    defaultValue: "POST"
})
@EventSetting({
    identifier: "http_schema",
    hidden: true,
    defaultValue: "application/json"
})
export class HubSpotContactCreatedWebhook extends Rest {}
