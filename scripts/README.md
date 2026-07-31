# Shared monorepo scripts

Tooling shared by every action under [`actions/`](../actions). Run from within
an action directory using a relative path (`../../scripts/...`), or from the
repo root via the root `package.json` scripts.

## OpenAPI → zod schema generation

Two composable steps turn a vendor's OpenAPI spec into a typed zod schema module
for an action. Any action that exposes data types from an OpenAPI spec (Stripe,
Shopify, etc.) can reuse them — nothing is vendor-specific.

### `openapi-filter.mjs`

Reduces a large OpenAPI document to just the resources an action exposes plus
everything they reference, so nested objects stay fully typed instead of
collapsing to untyped passthrough objects.

```
node ../../scripts/openapi-filter.mjs <input-spec.(json|yaml)> <output.json> \
     --roots <name,name,...> [--depth <n|infinity>] [--rename <old>=<new> ...]
```

- `--roots` — comma-separated component schema names the action exposes.
- `--depth` — how many `$ref` hops from a root to keep (default `infinity`,
  i.e. the full transitive closure; `$refs` beyond the horizon are stubbed as
  untyped objects). Lower it to trade completeness for a smaller output.
- `--rename <old>=<new>` (repeatable) — give an awkwardly-named component a
  stable identifier before roots are resolved (e.g. Twilio's
  `api.v2010.account.message`=`TwilioMessage`).
- YAML specs (`.yaml`/`.yml`) are accepted; the parser (`yaml` or `js-yaml`) is
  loaded from the action's `node_modules`, so add one as a devDependency. Output
  is always JSON.

### `openapi-to-zod.mjs`

Converts every schema under `components.schemas` into a zod schema.

```
node ../../scripts/openapi-to-zod.mjs <input-spec.json> <output.ts>
```

- Each schema becomes a `z.lazy(() => ...)` named const; every `$ref` becomes a
  reference to that const. Lazy evaluation resolves circular references without
  inlining, so memory stays O(number of schemas). (This is why we do not use
  `openapi-zod-client`, which OOMs expanding large circular specs like Stripe's.)
- Handles the full OpenAPI 3.0/3.1 Schema Object: `$ref`, `type` (incl. `null`
  and type arrays), `enum`, `const`, `allOf`/`anyOf`/`oneOf`/`not`, object shapes
  (`properties`/`required`/`additionalProperties`/`patternProperties`) and array
  shapes (`items`/`prefixItems`).
- Value constraints and annotations are recognized but not enforced (they never
  change the type). Any keyword that is neither handled nor ignored **throws**,
  so a new spec construct fails generation loudly instead of emitting a wrong
  schema.

### Wiring it into an action

Add a `generate:*-schemas` script to the action's `package.json`, e.g.:

```json
"generate:stripe-schemas": "curl -fsSL --create-dirs -o schemas/stripe-openapi.json <spec-url> && node ../../scripts/openapi-filter.mjs schemas/stripe-openapi.json schemas/stripe-openapi.filtered.json --roots customer,payment_intent,refund,charge && node ../../scripts/openapi-to-zod.mjs schemas/stripe-openapi.filtered.json src/generated/stripe-schemas.ts"
```

The generated file is committed, so this is a dev-time script — it is not run
during Docker builds or CI.

## `for-each-action.mjs`

Runs an npm script in every action that defines it (used by the root
`typecheck` / `build` / `test` scripts).

```
node scripts/for-each-action.mjs <script>
```
