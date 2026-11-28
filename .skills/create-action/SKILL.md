---
name: create-action
description: Scaffold a new TypeScript action under actions/<vendor>-action (package.json, vite, tsconfig, Dockerfile, manifest, index.ts, README, tests) and register it in CI. Use when starting a new integration for a vendor or service.
---

# Create a new action

An action is a standalone service that registers data types, runtime functions
and events with the runtime and executes them. Every action lives in
`actions/<vendor>-action/` and ships as its own container image.

Reference: `actions/discord-action`. Copy its structure, not its Discord logic.

## 1. Decide before you write code

Write these down (in the PR description or as a comment to the user) first:

- **Vendor and folder name** — `actions/<vendor>-action`, lowercase, kebab-case.
- **Vendor SDK** — prefer the vendor's official Node SDK (`discord.js`,
  `twilio`, …). Fall back to `fetch` only if there is none.
- **Credentials** — how a flow authenticates. Default (discord pattern): the
  credential is the **first parameter of every function and the first setting
  of every event**, so one running action serves any number of accounts and
  the action itself has no configuration (`[]` as the last `Action` argument).
  Only use action-level configuration (`context.matchedConfig.findConfig(...)`,
  see `twilio-action`) when the vendor has exactly one account per project by
  nature.
- **Scope of the first version** — a list of functions (verb + noun, e.g.
  `sendMessage`, `getChannel`), the data types they return, and the events.
  Start with the most common read + write operations; don't mirror the whole API.

## 2. Create the files

Copy the templates in [`templates/`](templates) into `actions/<vendor>-action/`
and replace the placeholders:

| Placeholder | Example |
|---|---|
| `__vendor__` | `telegram` (lowercase, used in ids and paths) |
| `__Vendor__` | `Telegram` (display name / class prefix) |
| `__VENDOR_SDK__` | `telegraf` (npm package of the vendor SDK, also listed as vite external) |
| `__ICON__` | `simple:telegram` (simple-icons) or `tabler:<icon>` |
| `__DESCRIPTION__` | One sentence: what the action lets a flow do. Same text in `index.ts`, `manifest.json` and `README.md`. |

Resulting layout:

```
actions/<vendor>-action/
├── .gitignore
├── Dockerfile
├── README.md
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── index.ts            # creates the Action, registers everything, connects
│   ├── client.ts           # vendor client, cached per credential
│   ├── helpers.ts          # mappers (vendor object -> data type), error handling
│   ├── eventBridge.ts      # only if the action has events
│   ├── data_types/<vendor><Noun>.ts
│   ├── functions/<group>/<vendor><Verb><Noun>.ts
│   └── events/<vendor><Noun><PastTenseVerb>.ts
└── test/
    └── index.test.ts
```

`<group>` is the resource the functions work on (`messaging`, `channels`,
`members`, …), not the HTTP verb.

## 3. Install dependencies

```bash
cd actions/<vendor>-action
corepack enable npm
npm install @code0-tech/hercules zod@4.4.3 <vendor-sdk>
npm install -D @types/node tsx typescript vite vitest
```

Commit the generated `package-lock.json`; CI and the Dockerfile run `npm ci`.
Keep `@code0-tech/hercules` and `zod` on the same versions as `discord-action`.

## 4. Write `client.ts` and `helpers.ts`

- `client.ts`: one function `get<Vendor>Client(credential)` that trims the
  credential, throws `RuntimeError("<VENDOR>_MISSING_<CREDENTIAL>", ...)` when
  it is empty, and caches one client per credential (see
  `discord-action/src/client.ts`; drop idle clients if the SDK holds
  connections open).
- `helpers.ts`:
  - `handle<Vendor>Error(error, fallbackCode, fallbackMessage): never` — maps
    vendor error codes to `RuntimeError("<VENDOR>_<REASON>", message)`,
    rethrows an existing `RuntimeError` unchanged, and falls back to
    `fallbackCode`.
  - `map<Vendor><Noun>(vendorObject)` per data type — see `add-data-type`.

## 5. Add data types, functions and events

Follow [`add-data-type`](../add-data-type/SKILL.md),
[`add-function`](../add-function/SKILL.md) and
[`add-event`](../add-event/SKILL.md). Register every class in `src/index.ts` —
an unregistered class is invisible in the editor and nothing else complains.

## 6. Wire it into the repository

- `.gitlab-ci.yml`: add `<vendor>-action` to the `.node-actions` list. This
  runs typecheck + tests and builds/publishes the image. Without it the action
  is never built.
- Root `README.md`: add the action wherever actions are listed.
- `manifest.json` image must be
  `ghcr.io/code0-tech/centaurus/ci-builds/<vendor>-action`.

## 7. Verify

Run [`test-action`](../test-action/SKILL.md), then
[`review-action`](../review-action/SKILL.md).
