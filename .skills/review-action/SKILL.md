---
name: review-action
description: Checklist to review a new or changed TypeScript action against the repository conventions (structure, naming, credentials, payloads, errors, tests, docs, CI) before opening or merging a PR. Use when reviewing action changes or finishing work on an action.
---

# Review an action

Go through the list for every action the change touches
(`git diff --stat main...HEAD -- actions/`). Report each failed item with the
file and line. Reference for "how it should look": `actions/discord-action`.

## Structure

- [ ] Folder is `actions/<vendor>-action` with `package.json`,
      `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`,
      `manifest.json`, `README.md`, `.gitignore`, `src/`, `test/`.
- [ ] `package.json` name `@code0-tech/<vendor>-action`, `packageManager`
      npm pinned, scripts `dev`, `typecheck`, `build`, `test`, `start`.
- [ ] `@code0-tech/hercules` and `zod` versions match `discord-action`.
- [ ] Every runtime dependency is listed as external in `vite.config.ts`.
- [ ] `manifest.json` identifier `<vendor>-action`, image
      `ghcr.io/code0-tech/centaurus/ci-builds/<vendor>-action`.
- [ ] Action added to `.node-actions` in `.gitlab-ci.yml` (and only there).
- [ ] No `dist/`, `node_modules/`, `module.json` or `.env` committed.

## Naming

- [ ] Functions: `functions/<group>/<vendor><Verb><Noun>.ts`, class
      `…Function`, identifier `<vendor><Verb><Noun>`.
- [ ] Data types: `data_types/<vendor><Noun>.ts`, `…Schema`, `…Type`,
      identifier `<VENDOR>_<NOUN>`.
- [ ] Events: `events/<vendor><Noun><PastTenseVerb>.ts`, class = identifier.
- [ ] All identifiers vendor-prefixed; error codes upper snake and
      vendor-prefixed.

## Registration and contract

- [ ] Every data type, function and event is registered in `src/index.ts`;
      nested data types before the ones that use them.
- [ ] `@Signature`, `@Parameter` list and `run()` arguments agree in names,
      order and optionality.
- [ ] Credential is the first, required parameter of every function and first
      setting of every event, with the same name everywhere. No credentials
      read from env.
- [ ] Filter settings of events are optional and empty means "match all".
- [ ] Every node has `@Name`, `@Description`, `@DisplayMessage`,
      `@DisplayIcon`; functions also `@Documentation`. Texts are `en-US`,
      sentence case, and describe the behaviour correctly.
- [ ] **No breaking change** to existing identifiers, parameter
      `runtimeName`s, setting identifiers or data type fields — or it is
      called out in the PR.

## Behaviour

- [ ] Every function body goes through `handle<Vendor>Error`; no raw vendor
      error, no `console.log` of credentials or payloads with personal data.
- [ ] Every returned value / event payload goes through a mapper that fills
      **every** schema field (`null` instead of missing).
- [ ] Optional schema fields are `.nullish()`.
- [ ] Inputs are trimmed / cleaned; empty optional input behaves like unset.
- [ ] Vendor clients are cached per credential and failed logins are not
      cached.
- [ ] Event listeners never throw out of a vendor callback; flows are fired
      with `Promise.allSettled`; the action ignores its own output where that
      could loop.
- [ ] Lists respect vendor limits / pagination and document the maximum.

## Tests and docs

- [ ] [`test-action`](../test-action/SKILL.md) checks pass: `typecheck`,
      `test`, `build`, `hercules export` counts match the registrations.
- [ ] Metadata test lists contain every function and event; a mapper test
      exists for every data type; new helpers and error mappings are tested.
- [ ] No real tokens, ids or personal data in fixtures.
- [ ] README: functions table, events table (with settings), the
      "payloads always carry every field" note, vendor setup (scopes,
      intents, webhooks), ENV table.
- [ ] Description identical in `index.ts`, `manifest.json` and README.
