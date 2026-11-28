---
name: add-function
description: Add or change a runtime function (a node a flow calls) in a TypeScript action — decorators, signature, parameters, error handling, registration and tests. Use when an action should be able to do something new, or an existing node's inputs/outputs change.
---

# Add a runtime function

A runtime function is one node in the flow editor. It is a class with hercules
decorators that describe the node, and a `run()` method that executes it.

Reference: `actions/discord-action/src/functions/messaging/discordSendMessage.ts`.

## 1. Name it

| What | Convention | Example |
|---|---|---|
| File | `src/functions/<group>/<vendor><Verb><Noun>.ts` | `functions/messaging/discordSendMessage.ts` |
| Class | `<Vendor><Verb><Noun>Function` | `DiscordSendMessageFunction` |
| `@Identifier` | `<vendor><Verb><Noun>` (camelCase, globally unique — always prefix the vendor) | `discordSendMessage` |
| Error fallback code | `ERROR_<VERB>ING_<NOUN>` | `ERROR_SENDING_MESSAGE` |

Verbs: `get` (one, by id), `get…s` (list), `create`, `update`, `delete`,
`send`, `add…To…`, `remove…From…`. Use the vendor's nouns, but plain English
where the vendor's term is obscure (Discord "guild" is shown as "server").

## 2. Write the class

```ts
import { Description, DisplayIcon, DisplayMessage, Documentation, Identifier, Name, Parameter, Signature } from "@code0-tech/hercules";
import { getVendorClient } from "../../client.js";
import { handleVendorError, mapVendorMessage } from "../../helpers.js";
import { VendorMessageType } from "../../data_types/vendorMessage.js";

@Identifier("vendorSendMessage")
@Signature("(apiToken: string, channelId: string, content: string, silent?: boolean): VENDOR_MESSAGE")
@Name({ code: "en-US", content: "Send message" })
@DisplayIcon("simple:vendor")
@DisplayMessage({ code: "en-US", content: "Send message to ${channelId}" })
@Documentation({ code: "en-US", content: "Longer explanation: what it does, limits, what is returned." })
@Description({ code: "en-US", content: "Send a message to a channel." })
@Parameter({
    runtimeName: "apiToken",
    name: [{ code: "en-US", content: "API token" }],
    description: [{ code: "en-US", content: "The token of the Vendor account that sends the message." }],
})
@Parameter({
    runtimeName: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "The ID of the target channel." }],
})
@Parameter({
    runtimeName: "content",
    name: [{ code: "en-US", content: "Content" }],
    description: [{ code: "en-US", content: "The text of the message." }],
})
@Parameter({
    runtimeName: "silent",
    name: [{ code: "en-US", content: "Silent" }],
    description: [{ code: "en-US", content: "Send without a notification." }],
    optional: true,
})
export class VendorSendMessageFunction {
    async run(
        _context: unknown,
        apiToken: string,
        channelId: string,
        content: string,
        silent?: boolean
    ): Promise<VendorMessageType> {
        try {
            const client = await getVendorClient(apiToken);
            const message = await client.messages.send(channelId, { content, silent: silent ?? false });
            return mapVendorMessage(message);
        } catch (error) {
            return handleVendorError(error, "ERROR_SENDING_MESSAGE", "Failed to send the message.");
        }
    }
}
```

### Rules

- **`@Signature` is the contract.** TypeScript-like:
  `(name: type, optional?: type): RETURN`. Types are `string`, `number`,
  `boolean`, or a data type identifier (`VENDOR_MESSAGE`), arrays as `TYPE[]`.
  Return `void` only if there is really nothing to return — prefer returning
  the affected object (e.g. delete returns the deleted message).
- **One `@Parameter` per signature parameter, in the same order**, with the
  same `runtimeName`. `run()` takes `context` first, then the parameters in
  that order. Optional parameters get `optional: true`, `?` in the signature
  and `?` in `run()`.
- **Credential first.** The first parameter is the credential, required
  (discord: `botToken`). Same name in every function and event of the action.
- **Context.** Name it `_context: unknown` when unused. Use
  `context: FunctionContext` only when reading action configuration
  (`context.matchedConfig.findConfig("<id>")`).
- **Texts.** `@Name` is short and in sentence case ("Send message").
  `@Description` is one sentence. `@Documentation` may be longer and use
  markdown. `@DisplayMessage` is what the node shows on the canvas and may
  interpolate parameters with `${name}`. Locale is `en-US`.
- **Errors.** Never let a raw vendor error escape: wrap the body in
  `try/catch` and route through `handle<Vendor>Error`, which throws a
  `RuntimeError` with an upper-snake code prefixed with the vendor
  (`DISCORD_UNKNOWN_CHANNEL`). Validation errors on input are `RuntimeError`s
  too (e.g. `DISCORD_EMPTY_MESSAGE`).
- **Output.** Always return through a `map<Vendor><Noun>` mapper so every field
  of the data type is present (see `add-data-type`). Lists return
  `map(...)` over the results and filter out `null`s the vendor returns for
  inaccessible items.
- **Inputs from flows are loose.** Trim strings, treat `""` like "not set" for
  optional parameters, and normalise input data types with small helpers
  (`cleanString`, `cleanUrl` in discord's `helpers.ts`).
- Keep vendor-specific logic (building payloads, pagination, limits) in
  `helpers.ts` so it can be unit-tested without the class.

## 3. Register it

In `src/index.ts`: import the class and add
`action.registerRuntimeFunction(<Class>);` next to the others of its group.

## 4. Test and document

- Add the class to the `functions` list in `test/index.test.ts` (credential and
  parameter checks run automatically) and test any new helper — see
  [`test-action`](../test-action/SKILL.md).
- Add a row to the **Functions** table in the action's `README.md`.

## Changing an existing function

- Renaming `@Identifier` or a parameter's `runtimeName`, removing a
  parameter, or making an optional parameter required **breaks existing flows**.
  Avoid it; add a new optional parameter or a new function instead. If it is
  unavoidable, say so explicitly in the PR.
- Adding an optional parameter at the end is safe.
- Keep signature, `@Parameter` list, `run()` and README in sync — the
  parameter test in `test/index.test.ts` catches order mismatches.
