---
name: test-action
description: Write and run the checks for a TypeScript action — vitest unit tests (metadata, mappers, helpers, faked vendor client), typecheck, build, module export and Docker build. Use after adding or changing anything in an action, and before opening a PR.
---

# Test an action

All checks run without the runtime (Aquila) and without real vendor
credentials. Tests must never call the real vendor API.

Reference: `actions/discord-action/test/`.

## 1. Run the checks

From `actions/<vendor>-action`:

```bash
corepack enable npm
npm ci                       # or npm install when adding dependencies
npm run typecheck            # tsc --noEmit, includes test/
npm test                     # vitest run
npm run build                # vite build -> dist/index.js
npx hercules export src/index.ts -o module.json
```

`hercules export` loads `index.ts` **without connecting** and writes the
module exactly as the runtime would receive it. Check that the counts match
what you registered:

```bash
node -e "const m=require('./module.json');for(const k of ['definitionDataTypes','functionDefinitions','flowTypes'])console.log(k,m[k].length)"
```

and skim the entries you added (names, parameters, signature). Don't commit
`module.json`.

CI (`.gitlab-ci.yml`, `test-node`) runs `npm ci`, `typecheck` and `test` for
every action in `.node-actions`; all actions at once from the repo root:
`npm run typecheck && npm test`.

Optionally build the image the way CI does:
`docker build -t <vendor>-action .`

## 2. What to test

Put tests in `test/*.test.ts`. Start every file with
`import "reflect-metadata";`.

### Metadata tests (required)

Taken over from the template in
`.skills/create-action/templates/test/index.test.ts`. Keep the `functions`
and `events` lists complete; the tests then check for each class:

- it is registered in `src/index.ts`,
- the credential is the first, required parameter / setting and starts the
  signature,
- the `@Parameter` list matches the signature and `run()`.

Decorator metadata is read with `Reflect.getMetadata(key, Class)`:
`hercules:function_parameters`, `hercules:signature`, `hercules:flow_settings`.

### Mapper tests (required per data type)

The most important behavioural test: every key of the data type is present.

```ts
it("fills every field of a message, using null for what the vendor omitted", () => {
    const message = mapVendorMessage({ id: "1", channel_id: "2", author: fakeUser, text: "hi",
        edited_at: null, created_at: "2026-11-24T11:27:31.344Z" } as any);

    expect(Object.keys(message).sort()).toEqual(Object.keys(VendorMessageSchema.shape).sort());
    expect(message.editedAt).toBeNull();
    expect(VendorMessageSchema.parse(message)).toBeTruthy();
});
```

Use a minimal fake object cast with `as any` — just the fields the mapper
reads. Use realistic but **fake** ids and values; never paste real tokens,
SIDs or keys (they trip secret scanners — see the comment in
`twilio-action/test/index.test.ts`).

### Helper tests

Pure logic in `helpers.ts`: input cleaning (empty string → undefined, invalid
URL dropped), payload building and its validation errors, enum mapping incl.
the `"unknown"` fallback, `toEventPayload` (undefined → null).

### Error tests

- vendor error codes map to the expected `RuntimeError` code
  (`expect(() => handleVendorError({ code: 50027, message: "…" })).toThrow(/VENDOR_…/)`),
- an existing `RuntimeError` passes through unchanged,
- a missing / blank credential is rejected
  (`await expect(getVendorClient("   ")).rejects.toBeInstanceOf(RuntimeError)`).

### Function / bridge tests with a fake client

To test a function's `run()` or the event bridge, replace the client module
before importing the code under test:

```ts
vi.mock("../src/client.js", () => ({
    getVendorClient: async (token: string) => fakeClients.get(token),
}));
const { VendorSendMessageFunction } = await import("../src/functions/messaging/vendorSendMessage.js");
```

The fake records what was called so the test can assert on it. Example:
`discord-action/test/slashCommands.test.ts`.

## 3. When a check fails

- Typecheck error in a decorator → usually a typo in a `@Parameter` /
  `@EventSetting` property; compare with discord.
- Missing count in the export → the class is not registered in `index.ts`.
- Mapper key test fails → a schema field was added without updating the
  mapper (or vice versa).
- Fix the code, not the test, unless the test encodes an outdated contract.
