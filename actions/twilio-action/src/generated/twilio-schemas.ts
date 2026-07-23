import { z } from "zod";

const TwilioMessage = z
  .object({
    body: z.string().nullable(),
    num_segments: z.string().nullable(),
    direction: z.enum([
      "inbound",
      "outbound-api",
      "outbound-call",
      "outbound-reply",
    ]),
    from: z.string().nullable(),
    to: z.string().nullable(),
    date_updated: z.string().nullable(),
    price: z.string().nullable(),
    error_message: z.string().nullable(),
    uri: z.string().nullable(),
    account_sid: z.string().nullable(),
    num_media: z.string().nullable(),
    status: z.enum([
      "queued",
      "sending",
      "sent",
      "failed",
      "delivered",
      "undelivered",
      "receiving",
      "received",
      "accepted",
      "scheduled",
      "read",
      "partially_delivered",
      "canceled",
    ]),
    messaging_service_sid: z.string().nullable(),
    sid: z.string().nullable(),
    date_sent: z.string().nullable(),
    date_created: z.string().nullable(),
    error_code: z.number().int().nullable(),
    price_unit: z.string().nullable(),
    api_version: z.string().nullable(),
    subresource_uris: z.object({}).partial().passthrough().nullable(),
  })
  .partial()
  .passthrough();

export const schemas = {
  TwilioMessage,
};
