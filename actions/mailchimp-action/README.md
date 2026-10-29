# Mailchimp Action

Mailchimp integration for the **Hercules** automation platform: manage
audiences (lists), subscribers, tags and campaigns, and react to Mailchimp
audience webhook events.

## Functions

| Function | Description |
|----------|-------------|
| `mailchimpAddOrUpdateMember` | Add a member to an audience, or update them if they already exist (upsert by email). |
| `mailchimpGetMember` | Look up a member of an audience by email. |
| `mailchimpUpdateMemberTags` | Add and/or remove tags on a member. |
| `mailchimpArchiveMember` | Archive (reversibly remove) a member from an audience. |
| `mailchimpDeleteMemberPermanent` | Permanently erase a member and their activity. |
| `mailchimpListMembers` | List the members of an audience, optionally filtered by status. |
| `mailchimpCreateCampaign` | Create a regular campaign for an audience and set its HTML content. |
| `mailchimpSendCampaign` | Send a saved campaign. |
| `mailchimpGetAudience` | Retrieve an audience's details and stats. |
| `mailchimpCreateMergeFields` | Util: build a `MAILCHIMP_MERGE_FIELDS` object from common merge tags (FNAME, LNAME, ADDRESS, PHONE, BIRTHDAY). |

All API calls use the official [`@mailchimp/mailchimp_marketing`](https://www.npmjs.com/package/@mailchimp/mailchimp_marketing)
Node.js SDK. Member endpoints are addressed by the MD5 hash of the lowercased
email address, which the action computes internally — flows pass a plain
email address.

## Events

Mailchimp audience webhooks are delivered as a single `application/x-www-form-urlencoded`
POST per audience, carrying a `type` field that discriminates the kind of
event. Each event below corresponds to one `type` value and validates it as a
literal in its payload schema:

| Event | Mailchimp webhook `type` |
|-------|---------------------------|
| `MailchimpSubscribed` | `subscribe` |
| `MailchimpUnsubscribed` | `unsubscribe` |
| `MailchimpProfileUpdated` | `profile` |
| `MailchimpEmailCleaned` | `cleaned` |
| `MailchimpCampaignSent` | `campaign` |

Configure the Mailchimp audience's webhook (Audience > Settings > Webhooks)
with the `httpURL` of these events. Since Mailchimp sends every event type for
an audience to that same URL, bind all five triggers for a given audience to
the same `httpURL`; each one only fires for requests whose `type` matches its
own payload schema.

## Configuration

| Config | Required | Description |
|--------|----------|--------------|
| `api_key` | yes | Mailchimp API key (`...-usX`). The `usX` suffix selects the API server/datacenter. |
| `server_prefix` | no | Datacenter prefix (e.g. `us21`) for the API host. Derived from the API key's suffix when left empty. |

## Data type schemas

The `@Schema` data types are hand-written `zod` schemas (the same approach
used by `gls-action`) rather than generated from an OpenAPI spec, since
Mailchimp's Marketing API spec is large and only a small, stable subset of
resources is exposed here:

- `MAILCHIMP_MEMBER`, `MAILCHIMP_MEMBER_LIST`, `MAILCHIMP_AUDIENCE`, `MAILCHIMP_CAMPAIGN`, `MAILCHIMP_TAG`, `MAILCHIMP_MERGE_FIELDS`
- Webhook payloads: `MailchimpSubscribeWebhookPayload`, `MailchimpUnsubscribeWebhookPayload`, `MailchimpProfileWebhookPayload`, `MailchimpCleanedWebhookPayload`, `MailchimpCampaignWebhookPayload`
