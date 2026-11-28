---
name: add-event
description: Add or change an event (a trigger that starts flows) in a TypeScript action — event class with settings, the event bridge that listens to the vendor and fires matching flows, payload mapping and tests. Use when something happening at the vendor should start a flow.
---

# Add an event

An event is a flow trigger. It has two halves:

1. **The event class** — decorators only. Declares the settings a flow fills
   in (credential, filters) and the payload type.
2. **The event bridge** (`src/eventBridge.ts`) — listens to the vendor
   (gateway, webhook server, polling), finds the flows whose settings match,
   and fires them with the mapped payload.

Reference: `actions/discord-action/src/events/discordMessageCreated.ts` and
`actions/discord-action/src/eventBridge.ts`.

## 1. Name it

| What | Convention | Example |
|---|---|---|
| File | `src/events/<vendor><Noun><PastTenseVerb>.ts` | `discordMessageCreated.ts` |
| Class + `@Identifier` | `<Vendor><Noun><PastTenseVerb>` (PascalCase, both identical) | `DiscordMessageCreated` |

## 2. Write the class

```ts
import { Description, DisplayIcon, DisplayMessage, EventSetting, Identifier, Name, Signature } from "@code0-tech/hercules";

@Identifier("VendorMessageCreated")
@DisplayIcon("simple:vendor")
@Name({ code: "en-US", content: "Vendor message created" })
@Description({ code: "en-US", content: "Triggered when a message is posted in a channel. Ignores messages sent by bots." })
@DisplayMessage({ code: "en-US", content: "Vendor message created" })
@Signature("(apiToken: string, channelId?: string): VENDOR_MESSAGE")
@EventSetting({
    identifier: "apiToken",
    name: [{ code: "en-US", content: "API token" }],
    description: [{ code: "en-US", content: "The token of the Vendor account that listens for messages." }],
})
@EventSetting({
    identifier: "channelId",
    name: [{ code: "en-US", content: "Channel ID" }],
    description: [{ code: "en-US", content: "Only react to messages in this channel. Empty reacts to every channel." }],
    optional: true,
})
export class VendorMessageCreated {}
```

### Rules

- The signature lists the settings and returns the **payload data type**.
- **Credential first**, required, same name as in the functions.
- Every other setting is a **filter**: optional, and an empty value is a
  wildcard ("Empty reacts to every channel" — say so in the description).
- Say in `@Description` what is ignored (bot messages, own messages, …) to
  prevent loops where a flow triggers itself.

## 3. Fire it from the event bridge

If the action has no `eventBridge.ts` yet, create one modelled on discord's
and call `startEventBridge(action)` in `index.ts` after the registrations.
Its parts:

- **Sync on flow changes.** Subscribe to `CodeZeroEvent.connected`,
  `flowUpdated` and `flowDeleted`; debounce (discord: 250 ms) and then walk
  `action.flows.values()`, collect the credentials of all event flows, and make
  sure a listener exists for each (`setPinnedTokens` keeps those clients alive).
  Credentials no event flow uses any more must be released again (discord:
  they are unpinned and dropped by the idle sweeper in `client.ts`).
- **Read settings** with a `readSetting(flow, identifier)` helper that returns
  the trimmed string value or `undefined` for empty.
- **Match** with `settingMatches(flow, identifier, value)`: an empty setting
  matches everything.
- **Fire** with `action.fire(flow.flowId, payload)` for every matching flow,
  via `Promise.allSettled` so one failing flow doesn't stop the others; log
  failures.
- **Payload**: `toEventPayload(map<Vendor><Noun>(...))` — the mapper fills every
  field (see `add-data-type`), `toEventPayload` turns remaining `undefined`
  into `null` and `Date` into ISO strings.
- **Never throw out of a vendor listener.** Wrap async handlers in
  `try/catch` and log; an unhandled rejection takes the action down.
- Add the identifier to the bridge's set of known event identifiers
  (`EVENT_IDENTIFIERS` in discord).

Vendor-specific constraints belong in the bridge and in the README, e.g.
discord defers slash command replies because Discord requires an answer within
3 s, and registers / removes slash commands to match the flows.

## 4. Register it

In `src/index.ts`: `action.registerRuntimeEventClass(<Class>);`.

## 5. Test and document

- Add the class to the `events` list in `test/index.test.ts` (credential check).
- Test the bridge logic that can be tested without the vendor: matching,
  payload mapping, and any sync against the vendor with a faked client via
  `vi.mock("../src/client.js", ...)` (see
  `discord-action/test/slashCommands.test.ts`).
- Add a row to the **Events** table in the README: identifier, when it fires,
  settings. Document setup the vendor needs (intents, webhook URL, scopes).

## Changing an existing event

Renaming the identifier or a setting identifier, or making a filter required,
breaks existing flows. Adding an optional filter setting is safe.
