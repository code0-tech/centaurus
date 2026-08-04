import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("SmtpEmailReceivedTrigger")
@DisplayIcon("tabler:mail")
@Name({ code: "en-US", content: "Email received" })
@Description({ code: "en-US", content: "Triggered when an email is received by the configured SMTP inbox." })
@DisplayMessage({ code: "en-US", content: "Email received from ${from}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: SMTP_EMAIL_RECEIVED_PAYLOAD): REST_ADAPTER_INPUT<SMTP_EMAIL_RECEIVED_PAYLOAD>")
@EventSetting({ identifier: "input_schema", hidden: true })
@EventSetting({ identifier: "httpMethod", hidden: true, defaultValue: "POST" })
@EventSetting({ identifier: "httpSchema", hidden: true, defaultValue: "application/json" })
export class SmtpEmailReceivedTrigger extends Rest {}
