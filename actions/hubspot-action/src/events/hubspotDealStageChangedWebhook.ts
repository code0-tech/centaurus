import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotDealStageChangedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot deal stage changed" })
@Description({ code: "en-US", content: "Triggered when a deal's stage changes in HubSpot (subscription type deal.propertyChange on dealstage)." })
@DisplayMessage({ code: "en-US", content: "HubSpot deal stage changed on ${http_url}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: HubSpotDealStageChangedWebhookPayload): REST_ADAPTER_INPUT<HubSpotDealStageChangedWebhookPayload>")
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
export class HubSpotDealStageChangedWebhook extends Rest {}
