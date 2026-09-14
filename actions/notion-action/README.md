# Notion action

Read and write Notion pages, use databases as a backing store, and start Hercules flows when database entries change.

## Setup

Use Node.js 24 (matching the other action containers).

```sh
npm ci
cp .example.env .env
# Fill in the Hercules connection settings and optionally NOTION_INTEGRATION_TOKEN.
npm run dev
```

On PowerShell, use `Copy-Item .example.env .env`. The dev/start scripts load `.env` if present. For a compiled process, run `npm run build` followed by `npm start`.

Create a Notion internal integration with read, insert and update content capabilities. Share each target database/page with that integration via **Add connections**. An integration token alone does not grant access to all workspace content.

| Project configuration | Type | Meaning |
| --- | --- | --- |
| `integration_token` | TEXT | Internal integration bearer token. If absent, uses `NOTION_INTEGRATION_TOKEN` from the process environment. An explicitly empty token is rejected. |
| `notion_version` | TEXT, optional | Defaults to `2022-06-28`. This implementation supports this pinned version only. |

Tokens are resolved per project, not cached globally, and are never put in exported module defaults. The environment fallback is shared by all projects that omit their own token.

Shared environment variables: `HERCULES_AUTH_TOKEN`, `HERCULES_AQUILA_URL` (default `localhost:50051`), `HERCULES_ACTION_ID` (default `notion-action`), `HERCULES_SDK_VERSION` (default `1.0.0`, used as the module version like the other actions).

## Functions

| Identifier | Parameters | Result |
| --- | --- | --- |
| `notionCreatePage` | `parentDatabaseId, properties, children?` | `NOTION_PAGE` |
| `notionUpdatePage` | `pageId, properties` | `NOTION_PAGE` |
| `notionGetPage` | `pageId` | `NOTION_PAGE` |
| `notionArchivePage` | `pageId` | `boolean` (Hercules BOOLEAN) |
| `notionQueryDatabase` | `databaseId, filter?, sorts?` | `NOTION_QUERY_RESULT` |
| `notionAppendBlocks` | `pageId, children` | `NOTION_BLOCK_LIST` |
| `notionSearch` | `query, filter?` | `NOTION_SEARCH_RESULT` |
| `notionCreateRichText` | `content, url?, bold?, italic?` | `NOTION_RICH_TEXT` |
| `notionCreatePropertyValue` | `type, value` | `NOTION_PROPERTY_VALUE` |

`properties` maps the existing database's property names to writable Notion values. Update sends only supplied properties. Create does not create a database or change its schema. Get retrieves page metadata/properties, not block children. Archive returns the state confirmed by Notion.

Query and search collect **all pages** of results into one response (`has_more: false`, `next_cursor: null`); large collections consume corresponding time and memory. Query filters accept the normal Notion property/timestamp filters and `and`/`or` groups. Sorts use either `property` or `timestamp` plus `direction`. Search matches titles, not full page text; its optional filter is `{ "property": "object", "value": "page" }` or `"database"`.

Append accepts a page or block ID. Create and append support at most 100 top-level child blocks per call. Notion validates block-specific shapes, nesting and request-size limits. API calls time out after 30 seconds. HTTP 429 is retried at most twice using `Retry-After` (up to 60 seconds); ambiguous network failures on writes are not automatically retried.

### Builder examples

The following illustrates values produced by the builders and passed to create/update functions:

```ts
// notionCreateRichText("Ship the release", undefined, true)
const title = {
  type: "text",
  text: { content: "Ship the release" },
  annotations: { bold: true, italic: false },
};

// notionCreatePropertyValue("title", [title])
// notionCreatePropertyValue("checkbox", false)
// notionCreatePropertyValue("select", "High")
const properties = {
  Name: { title: [title] },
  Done: { checkbox: false },
  Priority: { select: { name: "High" } },
};
```

Supported property builder types: `title`, `rich_text`, `number`, `checkbox`, `select`, `status`, `multi_select`, `date`, `url`, `email`, `phone_number`, `people`, `relation`. Text properties accept text or rich-text arrays; select/status accept a name; multi-select accepts name arrays; people/relation accept ID arrays. Date accepts ISO date text or `{ start, end?, time_zone? }`. Nullable properties accept `null` to clear. Empty arrays clear title/rich-text/multi-select/people/relation. Read-only properties such as formula and rollup cannot be built as write values.

## Polling events

| Event | Settings | Flow input |
| --- | --- | --- |
| `NotionDatabaseItemCreated` | `databaseId` | The new `NOTION_PAGE` |
| `NotionDatabaseItemUpdated` | `databaseId` | The edited `NOTION_PAGE` |
| `NotionPagePropertyChanged` | `databaseId, propertyName` | The changed `NOTION_PAGE` |

Hercules registers each class as a RuntimeEvent **and** its matching Event definition. The poller reads Aquila's flow settings and each flow's project configuration. It calls `action.fire(flowId, page)` only for the matching flow; it does not broadcast to every flow of that event type.

- Polling runs immediately after connection and every 60 seconds, without overlapping poll cycles. API calls and flow acknowledgements can make a cycle take longer.
- The first successful, fully paginated query establishes a baseline and emits no historical pages. Created detects newly observed pages whose creation time is at or after watch activation; moving an old page into a database is not a creation event.
- Updated detects increasing `last_edited_time`. A newly observed page that has already been edited can also trigger it. A new, unedited page is handled by Created.
- PropertyChanged compares the exact, case-sensitive property's API value against the previous snapshot. Other property edits do not trigger it. The first observation of a page establishes its property baseline. Removing/clearing a previously present value also triggers it. The payload is the current page, not a before/after diff.
- Subsequent queries use an inclusive `last_edited_time` cursor with a 60-second overlap. Per-page snapshots suppress repeats, including timestamp ties. This covers short indexing delays, not arbitrarily delayed updates.
- Pagination failures do not commit a new cursor. Delivery failures retry without refiring already acknowledged pages in that batch. A missing acknowledgement times out after 60 seconds. Delivery is **at least once**: a flow may have run even if its acknowledgement was lost, so downstream side effects should be idempotent.
- Checkpoints and property snapshots are **in memory**. Restart/reconnect, changed credentials, or changed watch settings establish a new baseline. Changes during downtime are not replayed. Use one action process for a given set of flows; this action has no distributed lock or shared durable checkpoint.
- Polling observes states, not every intermediate edit. A value changed and reverted between polls is not detectable. Archived/deleted pages disappear from database queries and do not emit a deletion event. Large/truncated relation or rollup properties are limited to what Notion returns in page properties.

No inbound HTTP server, public webhook URL or cron-action dependency is required.

## Data types and compatibility

Each data type has its own file under `src/data_types/`: the nine requested response/value types plus `NotionProperties`, `NotionFilter`, `NotionSort` and `NotionSearchFilter` for function inputs. Zod schemas describe common fields and preserve additional Notion fields. They are deliberately extensible, not exhaustive validators for every Notion block or property subtype. No `z.custom()` schemas are used. Hercules `1.4.5` and Zod `4.4.3` are pinned together because newer Zod internals are incompatible with this Hercules release's embedded schema exporter.

The API is pinned to the [legacy database API (`2022-06-28`)](https://developers.notion.com/reference/post-database-query). Starting with [`2025-09-03`, Notion separates databases and data sources](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03); multi-source databases and the newer endpoints are not supported here. Incompatible `notion_version` values fail locally with a clear runtime error.

Notion now also supports [native webhooks](https://developers.notion.com/reference/webhooks). This action intentionally implements the requested polling triggers.

## Verification and container

```sh
npm run typecheck
npm test
npm run build
npx hercules export dist/index.js --compact
docker build -t notion-action .
docker run --env-file .env notion-action
```

Tests live under `src/tests/`. They use mocked HTTP calls and flow dispatch, covering request mapping, pagination, retries, builders, polling state and actual Hercules module registration. No live Notion or Aquila credentials are required. A live end-to-end test requires a shared Notion database and a configured Aquila instance.
