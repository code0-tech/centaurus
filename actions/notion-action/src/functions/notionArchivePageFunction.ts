import { Description, DisplayIcon, DisplayMessage, Identifier, Name, Parameter, Signature, type FunctionContext } from "@code0-tech/hercules";
import { NotionClient } from "../client.js";


@Identifier("notionArchivePage")
@Name({ code: "en-US", content: "Archive Notion page" })
@Description({ code: "en-US", content: "Archive a page; returns whether Notion confirmed it is archived." })
@DisplayIcon("simple:notion")
@DisplayMessage({ code: "en-US", content: "Archive Notion page" })
@Signature("(pageId: string): boolean")
@Parameter({ runtimeName: "pageId", name: [{ code: "en-US", content: "pageId" }], description: [{ code: "en-US", content: "Page ID" }] })
export class NotionArchivePageFunction {
    run(context: FunctionContext, pageId: string) {
        return new NotionClient(context.matchedConfig).archivePage(pageId);
    }
}

