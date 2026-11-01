# Notion action

Hercules action for [Notion](https://developers.notion.com/). It turns Notion
into a lightweight backing store, task tracker, or knowledge base for flows:
create and update pages in a database, query and search, append block content,
and trigger flows when watched database items change.

## Configuration

Set on the action via its configuration definitions:

| Identifier          | Type          | Description                                                         |
|---------------------|---------------|---------------------------------------------------------------------|
| `integration_token` | TEXT          | Internal-integration token (used as the `Bearer` token).            |
| `notion_version`    | TEXT (opt.)   | `Notion-Version` header. Defaults to `2022-06-28`.                  |

The `integration_token` default is read from the `NOTION_INTEGRATION_TOKEN`
environment variable when present.

## Functions

| Function                | Returns                |
|-------------------------|------------------------|
| `notionCreatePage`      | `NOTION_PAGE`          |
| `notionUpdatePage`      | `NOTION_PAGE`          |
| `notionGetPage`         | `NOTION_PAGE`          |
| `notionArchivePage`     | `boolean`              |
| `notionQueryDatabase`   | `NOTION_QUERY_RESULT`  |
| `notionAppendBlocks`    | `NOTION_BLOCK_LIST`    |
| `notionSearch`          | `NOTION_SEARCH_RESULT` |

Utility builders `notionCreateRichText` and `notionCreatePropertyValue` help
assemble Notion's nested rich-text and property-value shapes.

## Triggers

Notion has no push webhooks for most events, so triggers poll the API on an
interval (default 60s, override with `NOTION_POLL_INTERVAL_MS`):

- `NotionDatabaseItemCreated` — a new page appears in a watched database.
- `NotionDatabaseItemUpdated` — a page in a watched database is edited.
- `NotionPagePropertyChanged` — a watched property of a page changes value.
