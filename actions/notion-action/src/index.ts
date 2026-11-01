import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { NotionPageDataType } from "./data_types/notionPage.js";
import { NotionDatabaseDataType } from "./data_types/notionDatabase.js";
import { NotionBlockDataType } from "./data_types/notionBlock.js";
import { NotionBlockListDataType } from "./data_types/notionBlockList.js";
import { NotionQueryResultDataType } from "./data_types/notionQueryResult.js";
import { NotionSearchResultDataType } from "./data_types/notionSearchResult.js";
import { NotionRichTextDataType } from "./data_types/notionRichText.js";
import { NotionPropertyValueDataType } from "./data_types/notionPropertyValue.js";
import { NotionUserDataType } from "./data_types/notionUser.js";

import { CreatePageFunction } from "./functions/createPageFunction.js";
import { UpdatePageFunction } from "./functions/updatePageFunction.js";
import { GetPageFunction } from "./functions/getPageFunction.js";
import { ArchivePageFunction } from "./functions/archivePageFunction.js";
import { QueryDatabaseFunction } from "./functions/queryDatabaseFunction.js";
import { AppendBlocksFunction } from "./functions/appendBlocksFunction.js";
import { SearchFunction } from "./functions/searchFunction.js";
import { CreateRichTextFunction } from "./functions/utils/createRichTextFunction.js";
import { CreatePropertyValueFunction } from "./functions/utils/createPropertyValueFunction.js";

import { NotionDatabaseItemCreatedEvent } from "./events/notionDatabaseItemCreated.js";
import { NotionDatabaseItemUpdatedEvent } from "./events/notionDatabaseItemUpdated.js";
import { NotionPagePropertyChangedEvent } from "./events/notionPagePropertyChanged.js";

import { NotionPoller } from "./poller.js";

const action = new Action(
    process.env.ACTION_ID ?? "notion-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "tabler:brand-notion",
    "Notion integration: create, update, query, and archive pages, append blocks, and search workspaces via the Notion API.",
    [{ code: "en-US", content: "Notion" }],
    [
        {
            identifier: "integration_token",
            type: "TEXT",
            defaultValue: process.env.NOTION_INTEGRATION_TOKEN ?? "",
            name: [{ code: "en-US", content: "Integration token" }],
            description: [
                {
                    code: "en-US",
                    content:
                        "The internal-integration token used as the Bearer token for the Notion API.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "notion_version",
            type: "TEXT",
            optional: true,
            defaultValue: "2022-06-28",
            name: [{ code: "en-US", content: "Notion version" }],
            description: [
                {
                    code: "en-US",
                    content: "The Notion-Version header sent with every request. Defaults to 2022-06-28.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
    ]
);

action.registerDataTypeClass(NotionRichTextDataType);
action.registerDataTypeClass(NotionUserDataType);
action.registerDataTypeClass(NotionPropertyValueDataType);
action.registerDataTypeClass(NotionBlockDataType);
action.registerDataTypeClass(NotionBlockListDataType);
action.registerDataTypeClass(NotionPageDataType);
action.registerDataTypeClass(NotionDatabaseDataType);
action.registerDataTypeClass(NotionQueryResultDataType);
action.registerDataTypeClass(NotionSearchResultDataType);

action.registerRuntimeFunction(CreatePageFunction);
action.registerRuntimeFunction(UpdatePageFunction);
action.registerRuntimeFunction(GetPageFunction);
action.registerRuntimeFunction(ArchivePageFunction);
action.registerRuntimeFunction(QueryDatabaseFunction);
action.registerRuntimeFunction(AppendBlocksFunction);
action.registerRuntimeFunction(SearchFunction);
action.registerRuntimeFunction(CreateRichTextFunction);
action.registerRuntimeFunction(CreatePropertyValueFunction);

action.registerRuntimeEventClass(NotionDatabaseItemCreatedEvent);
action.registerRuntimeEventClass(NotionDatabaseItemUpdatedEvent);
action.registerRuntimeEventClass(NotionPagePropertyChangedEvent);

const poller = new NotionPoller(action);

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        });
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

poller.start();

export { action };
