import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { schemas } from "../generated/twilio-schemas.js";

/**
 * TWILIO_MESSAGE is generated from Twilio's official OpenAPI spec
 * (twilio/twilio-oai, spec/json/twilio_api_v2010.json). The spec is filtered
 * down to the `api.v2010.account.message` component and re-exposed as
 * `TwilioMessage` (see scripts/filterTwilioSpec.mjs), then converted to a zod
 * schema by openapi-zod-client. Regenerate with `npm run generate:twilio-schemas`.
 */
export const TwilioMessageSchema = schemas.TwilioMessage;
export type TwilioMessage = z.infer<typeof TwilioMessageSchema>;

@Identifier("TWILIO_MESSAGE")
@Name({ code: "en-US", content: "Twilio message" })
@DisplayMessage({ code: "en-US", content: "Twilio message" })
@Schema(TwilioMessageSchema)
export class TwilioMessageDataType {}
