import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Rest, Signature } from "@code0-tech/hercules";

@Identifier("SmtpEmailSentTrigger")
@DisplayIcon("tabler:mail")
@Name({ code: "en-US", content: "Email sent" })
@Description({ code: "en-US", content: "Triggered when an email is successfully sent through the configured SMTP server." })
@DisplayMessage({ code: "en-US", content: "Email sent to ${to}" })
@Signature("<A extends REST_AUTH_TYPE>(httpSchema: HTTP_SCHEMA, httpURL: HTTP_URL, httpMethod: HTTP_METHOD, httpAuth: A, httpAuthValue: REST_AUTH_VALUE<A>, input_schema?: SMTP_EMAIL_SENT_PAYLOAD): REST_ADAPTER_INPUT<SMTP_EMAIL_SENT_PAYLOAD>")
@EventSetting({ identifier: "input_schema", hidden: true })
@EventSetting({ identifier: "httpMethod", hidden: true, defaultValue: "POST" })
@EventSetting({ identifier: "httpSchema", hidden: true, defaultValue: "application/json" })
export class SmtpEmailSentTrigger extends Rest {}
