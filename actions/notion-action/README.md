# Notion action

Read and write Notion pages, use databases as a backing store, and start Hercules flows when database entries change.

## Setup

Use Node.js 24 (matching the other action containers).

```sh
npm ci
cp .example.env .env
# Fill in the Hercules connection settings.
npm run dev
```

On PowerShell, use `Copy-Item .example.env .env`. The dev/start scripts load `.env` if present. For a compiled process, run `npm run build` followed by `npm start`.

Create a Notion internal integration with read, insert and update content capabilities. Share each target database/page with that integration via **Add connections**. An integration token alone does not grant access to all workspace content.

The action has no project configuration. Every function and every trigger takes the integration token it works with as its first parameter, a plain text value, so one running action serves as many Notion integrations as its flows use. Tokens are never cached globally and never put in exported module defaults; an empty token is rejected.

Each trigger additionally has an optional **Poll interval (seconds)** setting (`pollIntervalSeconds`, minimum 10 seconds). Without it the trigger uses `NOTION_POLL_INTERVAL_MS` of the action process (default 60 seconds).

Shared environment variables: `HERCULES_AUTH_TOKEN`, `HERCULES_AQUILA_URL` (default `localhost:50051`), `HERCULES_ACTION_ID` (default `notion-action`), `HERCULES_SDK_VERSION` (default `1.0.0`, used as the module version like the other actions).

## Functions

| Identifier | Parameters | Result |
| --- | --- | --- |
| `notionCreatePage` | `integrationToken, parentDatabaseId, properties, markdown?` | `NOTION_PAGE` |
| `notionUpdatePage` | `integrationToken, pageId, properties` | `NOTION_PAGE` |
| `notionGetPage` | `integrationToken, pageId` | `NOTION_PAGE` |
| `notionArchivePage` | `integrationToken, pageId` | `boolean` (Hercules BOOLEAN) |
| `notionQueryDatabase` | `integrationToken, databaseId, filter?, sort?` | `NOTION_QUERY_RESULT` |
| `notionSearch` | `integrationToken, query, filter?` | `NOTION_SEARCH_RESULT` |

`properties` is a plain object of the existing database's column names and values (see below). Update changes only the supplied columns. Create does not create a database or change its schema. Get retrieves the page with its properties and its content as Notion-flavored Markdown in `markdown` (two parallel requests: the page and `GET /pages/{id}/markdown` with `markdown_version: "v2"`). `markdown` is an optional field of `NOTION_PAGE` that only Get fills in; other functions and the triggers return pages without content. Archive moves the page to the trash (`in_trash`) and returns the state confirmed by Notion.

Query and search collect **all pages** of results into one response (`has_more: false`, `next_cursor: null`); large collections consume corresponding time and memory. Query filters accept the normal Notion property/timestamp filters and `and`/`or` groups. The optional sort is one column, `{ "property": "Due", "direction": "ascending" }`; without it, results come newest first (`created_time` descending). Search matches titles, not full page text; its optional filter is `{ "property": "object", "value": "page" }` or `"data_source"`.

Create takes optional page content as Markdown (`markdown`), sent as [Notion-flavored Markdown](https://developers.notion.com/guides/data-apis/migrate-to-notion-flavored-markdown) (`markdown_version: "v2"`); Notion converts it into blocks such as headings, lists, to-dos (`- [ ]`), quotes, code blocks and links. Empty content creates an empty page. API calls time out after 30 seconds. HTTP 429 is retried at most twice using `Retry-After` (up to 60 seconds); ambiguous network failures on writes are not automatically retried.

### Properties

Create and update take the column values as a plain object, e.g. `{ "Name": "Ship the release", "Done": false, "Tags": ["a", "b"], "Due": "2026-09-14" }`. The action looks up the column types (create: the database's data source, update: the page) and converts each value:

| Column type | Value |
| --- | --- |
| `title`, `rich_text`, `url`, `email`, `phone_number` | text (title/rich text: max 2000 characters) |
| `number` | a number |
| `checkbox` | `true` or `false` |
| `select`, `status` | the option name |
| `multi_select` | an option name or a list of names |
| `date` | a `DATE` (e.g. a page timestamp or `std::date::now`), ISO date text, or `{ start, end }` with either |
| `people`, `relation` | a user/page ID or a list of IDs |

`null`, an empty text or an empty list clears a column. A value already in Notion's shape (e.g. `{ "select": { "name": "High" } }` or formatted rich text) is sent as is. Unknown columns (`NOTION_UNKNOWN_PROPERTY`) and read-only types such as formula and rollup (`NOTION_READ_ONLY_PROPERTY`) are rejected before anything is written. Converting costs one extra request (the column lookup) per create or update with values.

## Polling events

| Event | Settings | Flow input |
| --- | --- | --- |
| `NotionDatabaseItemCreated` | `integrationToken, databaseId, pollIntervalSeconds?` | The new `NOTION_PAGE` |
| `NotionDatabaseItemUpdated` | `integrationToken, databaseId, pollIntervalSeconds?` | The edited `NOTION_PAGE` |
| `NotionPagePropertyChanged` | `integrationToken, databaseId, propertyName, pollIntervalSeconds?` | The changed `NOTION_PAGE` |

Hercules registers each class as a RuntimeEvent **and** its matching Event definition. The poller reads the token, database and interval from Aquila's flow settings. It calls `action.fire(flowId, page)` only for the matching flow; it does not broadcast to every flow of that event type.

- Polling runs immediately after connection. Each flow is then polled every `pollIntervalSeconds` of its own settings (minimum 10 seconds), falling back to `NOTION_POLL_INTERVAL_MS` of the action process (default 60 seconds); a base timer checks every 10 seconds which flows are due. Poll cycles do not overlap. After a flow establishes its baseline, one extra poll follows after 10 seconds so a first change shows up quickly. Changing the interval keeps the baseline. Each poll is one Notion API request per watched flow, so keep intervals and the number of flows per integration within Notion's rate limit (about three requests per second). API calls and flow acknowledgements can make a cycle take longer.
- Notion rounds `created_time` down to the minute; item-created watches therefore count pages from the start of the activation minute.
- The first successful, fully paginated query establishes a baseline and emits no historical pages. Created detects newly observed pages whose creation time is at or after watch activation; moving an old page into a database is not a creation event.
- Updated detects increasing `last_edited_time`. A newly observed page that has already been edited can also trigger it. A new, unedited page is handled by Created.
- PropertyChanged compares the exact, case-sensitive property's API value against the previous snapshot. Other property edits do not trigger it. The first observation of a page establishes its property baseline. Removing/clearing a previously present value also triggers it. The payload is the current page, not a before/after diff.
- Subsequent queries use an inclusive `last_edited_time` cursor with a 60-second overlap. Per-page snapshots suppress repeats, including timestamp ties. This covers short indexing delays, not arbitrarily delayed updates.
- Pagination failures do not commit a new cursor. Delivery failures retry without refiring already acknowledged pages in that batch. A missing acknowledgement times out after 60 seconds. Delivery is **at least once**: a flow may have run even if its acknowledgement was lost, so downstream side effects should be idempotent.
- Checkpoints and property snapshots are **in memory**. Restart/reconnect, changed credentials, or changed watch settings establish a new baseline. Changes during downtime are not replayed. Use one action process for a given set of flows; this action has no distributed lock or shared durable checkpoint.
- Polling observes states, not every intermediate edit. A value changed and reverted between polls is not detectable. Archived/deleted pages disappear from database queries and do not emit a deletion event. Large/truncated relation or rollup properties are limited to what Notion returns in page properties.

No inbound HTTP server, public webhook URL or cron-action dependency is required.

## Data types and compatibility

Each data type has its own file under `src/data_types/`: the response/value types plus `NotionFilter`, `NotionSort` and `NotionSearchFilter` for function inputs. Zod schemas describe common fields and preserve additional Notion fields. They are deliberately extensible, not exhaustive validators for every Notion block or property subtype. No `z.custom()` schemas are used. Zod is pinned to `4.4.3`, the version Hercules' embedded schema exporter is built against.

`NOTION_FILTER` is deliberately compact (a plain object) rather than the full generated Notion union: that union is over 10k characters long and makes the flow editor's type checker take seconds to minutes per node, so no parameter suggestions appear. Notion validates the filter.

Points in time in responses (`created_time`, `last_edited_time`, file `expiry_time`, calendar `start_time`/`end_time`) are `DATE` values, i.e. Unix microseconds (UTC); the client converts Notion's ISO 8601 strings before validating a response. Values flows send to Notion keep Notion's formats: filter timestamps and date property values (`{ start, end, time_zone }`) are sent as ISO 8601 text, because Notion distinguishes date-only values and time zones that a `DATE` cannot express. Create and update also accept a `DATE` for a date column and convert it to an ISO 8601 date-time (UTC).

The API is pinned to [`2025-09-03`](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03), where a database is a container of one or more data sources and pages live in a data source. Functions and triggers keep taking a `databaseId`: the action resolves the database's data source (`GET /databases/{id}`) and then queries or creates pages in it. Databases with several data sources are ambiguous and fail with `NOTION_MULTIPLE_DATA_SOURCES`; the triggers resolve the data source once per watch.

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
