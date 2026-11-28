---
name: add-data-type
description: Add or change a data type (the shape of values flows pass around) in a TypeScript action — zod schema, decorators, mapper that fills every field, optional OpenAPI generation. Use when a function or event needs to return or accept a structured value.
---

# Add a data type

A data type is a named zod schema the editor knows about. Functions return
it, take it as a parameter, and events carry it as payload.

Reference: `actions/discord-action/src/data_types/discordMessage.ts`,
`discordChannel.ts` (enum), `discordEmbed.ts` (several types in one file).

## 1. Name it

| What | Convention | Example |
|---|---|---|
| File | `src/data_types/<vendor><Noun>.ts` | `discordMessage.ts` |
| Schema | `<Vendor><Noun>Schema` (enums: `<Vendor><Noun>Enum`) | `DiscordMessageSchema` |
| TS type | `<Vendor><Noun>Type` | `DiscordMessageType` |
| Class | `<Vendor><Noun>` | `DiscordMessage` |
| `@Identifier` | `<VENDOR>_<NOUN>` upper snake, vendor-prefixed | `DISCORD_MESSAGE` |

## 2. Write it

```ts
import { DisplayMessage, Identifier, Name, Schema } from "@code0-tech/hercules";
import { z } from "zod";
import { VendorUserSchema } from "./vendorUser.js";

export const VendorMessageSchema = z.object({
    id: z.string(),
    channelId: z.string(),
    author: VendorUserSchema,
    content: z.string(),
    editedAt: z.string().nullish(),
    createdAt: z.string(),
});
export type VendorMessageType = z.infer<typeof VendorMessageSchema>;

@Identifier("VENDOR_MESSAGE")
@Name({ code: "en-US", content: "Vendor Message" })
@DisplayMessage({ code: "en-US", content: "Vendor Message: ${id}" })
@Schema(VendorMessageSchema)
export class VendorMessage {}
```

### Schema rules

- **camelCase field names**, even if the vendor API uses snake_case. Map in
  the mapper, not in the schema.
- Only fields a flow would plausibly use. A data type is not a dump of the
  vendor response.
- Anything the vendor may omit is `.nullish()` — not `.optional()` — so the
  mapper can return `null` and inputs may still leave it out.
- Timestamps are ISO strings (`date.toISOString()`), ids are strings, colors /
  enums are their simplest form.
- Fixed value sets are a `z.enum([...])` with their own data type
  (`DISCORD_CHANNEL_TYPE`); always include an `"unknown"` fallback when
  mapping from a vendor enum that may grow.
- Reuse nested schemas by importing them (`author: DiscordUserSchema`), and
  give every nested object that a flow may build itself its own data type
  (`DISCORD_EMBED_FIELD`, `DISCORD_EMBED_FOOTER`, …).
- `@DisplayMessage` may interpolate a field (`"Channel: #${name}"`).

## 3. Write the mapper

Add `map<Vendor><Noun>(vendorObject): <Vendor><Noun>Type` to `helpers.ts`.

**Every field the schema declares must be present in the result — use `null`
for what the vendor did not send, never leave a key out.** A missing key has
no reference in the flow's value store, so a flow that reads it fails with
`ReferenceValueNotFound`.

```ts
export function mapVendorMessage(msg: VendorSdkMessage): VendorMessageType {
    return {
        id: msg.id,
        channelId: msg.channel_id,
        author: mapVendorUser(msg.author),
        content: msg.text ?? "",
        editedAt: msg.edited_at ? new Date(msg.edited_at).toISOString() : null,
        createdAt: new Date(msg.created_at).toISOString(),
    };
}
```

If the same object reaches the action in two shapes (SDK object and raw API
JSON), write one mapper per shape and test that both produce the same keys
(discord: `mapDiscordMessage` / `mapApiMessage`).

## 4. Register it

In `src/index.ts`: `action.registerDataTypeClass(<Class>);`. Register nested
types **before** the types that use them.

## 5. Test it

Add a mapper test (see [`test-action`](../test-action/SKILL.md), "Mapper
tests"): build a minimal vendor object, map it, and assert that the keys equal
`Object.keys(<Schema>.shape)` and that `<Schema>.parse(result)` succeeds.

## Generating data types from an OpenAPI spec

For large vendor objects with an official OpenAPI spec (Stripe, Twilio,
Shopware, GitHub) generate the zod schemas instead of writing them:

1. Add a `generate:<vendor>-schemas` script to `package.json` that downloads
   the spec into `schemas/`, filters it with
   `../../scripts/openapi-filter.mjs --roots <component,...>` and converts it
   with `../../scripts/openapi-to-zod.mjs` into
   `src/generated/<vendor>-schemas.ts`. Full options:
   [`scripts/README.md`](../../scripts/README.md); working example:
   `actions/twilio-action/package.json`.
2. Run it once and commit `schemas/*.filtered.json` and the generated file.
   It is not run in CI or in Docker.
3. The data type file re-exports the generated schema and adds the decorators:
   ```ts
   export const VendorMessageSchema = schemas.VendorMessage;
   ```
   and documents where it comes from and how to regenerate (see
   `twilio-action/src/data_types/twilioMessage.ts`).

Generated schemas keep the vendor's field names (snake_case); that is
accepted for generated types. Never edit `src/generated/` by hand.

## Changing an existing data type

Removing or renaming a field, or changing its type, breaks flows that read it.
Adding a `.nullish()` field is safe. Keep the mapper and its test in step.
