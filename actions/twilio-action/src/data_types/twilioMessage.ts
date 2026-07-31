import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/twilio-schemas.js";

/**
 * TWILIO_MESSAGE is generated from Twilio's official OpenAPI spec
 * (twilio/twilio-oai, spec/json/twilio_api_v2010.json). The spec is reduced to
 * the `api.v2010.account.message` component (re-exposed as `TwilioMessage`) plus
 * everything it references via the shared scripts/openapi-filter.mjs, then
 * converted to zod by the shared scripts/openapi-to-zod.mjs. Regenerate with
 * `npm run generate:twilio-schemas`.
 */
export const TwilioMessageSchema = schemas.TwilioMessage;
export type TwilioMessage = z.infer<typeof TwilioMessageSchema>;

@Identifier("TWILIO_MESSAGE")
@Name({ code: "en-US", content: "Twilio message" })
@DisplayMessage({ code: "en-US", content: "Twilio message" })
@Schema(TwilioMessageSchema)
export class TwilioMessageDataType {}
