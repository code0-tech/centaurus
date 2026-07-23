import { z } from "zod";

const TwilioMessage = z
  .object({
    body: z.string().nullable(),
    num_segments: z.string().nullable(),
    direction: z.object({}).partial().passthrough(),
    from: z.string().nullable(),
    to: z.string().nullable(),
    date_updated: z.string().nullable(),
    price: z.string().nullable(),
    error_message: z.string().nullable(),
    uri: z.string().nullable(),
    account_sid: z
      .string()
      .min(34)
      .max(34)
      .regex(/^AC[0-9a-fA-F]{32}$/)
      .nullable(),
    num_media: z.string().nullable(),
    status: z.object({}).partial().passthrough(),
    messaging_service_sid: z
      .string()
      .min(34)
      .max(34)
      .regex(/^MG[0-9a-fA-F]{32}$/)
      .nullable(),
    sid: z
      .string()
      .min(34)
      .max(34)
      .regex(/^(SM|MM)[0-9a-fA-F]{32}$/)
      .nullable(),
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
