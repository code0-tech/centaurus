# Airtable Action

Airtable integration for the **Hercules** automation platform: create, read,
update and search records, and react to new and changed records.

The action holds no credentials of its own: **every runtime function and every
event takes the Airtable personal access token it works with as its first
parameter**, so one running action serves as many Airtable accounts as its flows
use. There is nothing to configure on the module.

## Personal access token

Create a token at <https://airtable.com/create/tokens> and grant it access to
the bases the flows work with. The scopes it needs depend on what the flows do:

| Scope | Needed for |
|-------|------------|
| `data.records:read` | Reading and searching records, both events |
| `data.records:write` | Creating, updating, upserting and deleting records |
| `schema.bases:read` | `airtableListBases`, `airtableGetTables` |

## Functions

| Function | Description |
|----------|-------------|
| `airtableCreateRecord` | Create a record. |
| `airtableCreateRecords` | Create several records, sent in batches of 10. |
| `airtableGetRecord` | Read a record by its ID. |
| `airtableUpdateRecord` | Update a record — merge the given fields, or replace the whole record. |
| `airtableDeleteRecord` | Delete a record, returns whether it was deleted. |
| `airtableListRecords` | Read records, with an optional formula filter, view, sort and limit (default 100). |
| `airtableFindRecord` | Find the first record whose field equals a value. |
| `airtableUpsertRecord` | Create a record, or update the one with the same key field. |
| `airtableListBases` | List the bases the token can access. |
| `airtableGetTables` | Read the tables of a base with their fields and views. |
| `airtableCreateFieldMap` | Set a field in a field map (chain calls to build `fields`). |
| `airtableCreateSort` | Create a sort for `airtableListRecords`. |
| `airtableAddAttachment` | Add a file from a public URL to an attachment field of a field map. |

The record functions start with `apiToken, baseId, tableId`
(e.g. `airtableCreateRecord(apiToken, baseId, tableId, fields, typecast?)`). The
table can be given by its ID (`tbl…`) or by its name.

**Fields** are an object of field names and cell values — `{ "Name": "Ada",
"Age": 36 }` — or the same as a JSON string. Airtable leaves empty cells out of a
record, so a field that is missing from `fields` is empty. With `typecast`
(default on) Airtable converts values to the field type, e.g. `"42"` into a
number field or a new option into a single select.

`airtableCreateFieldMap(field, value, fields?)` builds `fields` one field at a
time. Its `value` is text (`Completed`, `0.5`, `2024-12-31`) that `typecast`
converts; a JSON list such as `["recAbc123"]` sets a list field (linked records,
multiple selects, attachments).

**Find** compares the cell as text (`{field} & "" = "value"`), so a number field
matches `"42"`. It fails with `AIRTABLE_RECORD_NOT_FOUND` when no record matches.

**Upsert** uses Airtable's own `performUpsert`: the key field has to be part of
`fields`, and Airtable fails if more than one record has that key.

## Events

| Event | Fires when | Settings |
|-------|------------|----------|
| `AirtableRecordCreated` | A record is created in the table. | `apiToken`, `baseId`, `tableId` |
| `AirtableRecordUpdated` | A record of the table changes. | `apiToken`, `baseId`, `tableId`, `watchedFields?` |

Both events deliver the record (`AIRTABLE_RECORD`) as payload.

Airtable has no push events for personal access tokens, so the action **polls**
every watched table — once a minute by default, configurable with
`AIRTABLE_POLL_INTERVAL_SECONDS` (at least 10). Flows that watch the same table
with the same token and settings share one poll. Only what happens after a flow
started listening is reported.

`watchedFields` is a comma separated list of field names. With it, only changes
to these fields trigger `AirtableRecordUpdated`; without it, every change does.

Good to know:

- A record that is created and changed again within the same poll interval is
  reported as created only — the update event fires for later changes.
- A change that leaves the watched values as they were (e.g. typing the same
  value again) is not reported.
- Airtable allows five requests per second and base. A rate limited request
  waits Airtable's 30 second penalty once, then fails with `AIRTABLE_RATE_LIMITED`.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `AIRTABLE_POLL_INTERVAL_SECONDS` | How often watched tables are checked for changes. | `60` |

Plus the base settings every action reads for the connection to the runtime,
see the [repository README](../../README.md).
