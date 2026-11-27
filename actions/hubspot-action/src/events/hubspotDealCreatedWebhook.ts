import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotDealCreatedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot deal created" })
@Description({ code: "en-US", content: "Triggered when a new deal is created in HubSpot (subscription type deal.creation)." })
@DisplayMessage({ code: "en-US", content: "HubSpot deal created on ${http_url}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: HubSpotDealCreatedWebhookPayload): REST_ADAPTER_INPUT<HubSpotDealCreatedWebhookPayload>")
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
export class HubSpotDealCreatedWebhook extends Rest {}
