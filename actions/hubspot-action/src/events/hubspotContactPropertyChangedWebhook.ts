import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("HubSpotContactPropertyChangedWebhook")
@DisplayIcon("simple:hubspot")
@Name({ code: "en-US", content: "HubSpot contact property changed" })
@Description({ code: "en-US", content: "Triggered when a watched contact property changes in HubSpot (subscription type contact.propertyChange). The watched property is chosen on the HubSpot webhook subscription; the changed property name and new value are in the payload (propertyName / propertyValue)." })
@DisplayMessage({ code: "en-US", content: "HubSpot contact property changed on ${http_url}" })
@Signature("<A extends REST_AUTH_TYPE>(http_schema: HTTP_SCHEMA, http_url: HTTP_URL, http_method: HTTP_METHOD, http_auth: A, http_auth_value: REST_AUTH_VALUE<A>, input_schema?: HubSpotContactPropertyChangedWebhookPayload): REST_ADAPTER_INPUT<HubSpotContactPropertyChangedWebhookPayload>")
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
export class HubSpotContactPropertyChangedWebhook extends Rest {}
