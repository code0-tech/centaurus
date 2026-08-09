import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { DiscordEmbedFooterData } from "../data_types/discordEmbed.js";

@Identifier("createDiscordEmbedFooter")
@Signature("(Text: string, IconUrl?: string): DISCORD_EMBED_FOOTER")
@Name({ code: "en-US", content: "Create Embed Footer" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Create Footer" })
@Documentation({
    code: "en-US",
    content: "Creates a footer object for a Discord embed.",
})
@Description({ code: "en-US", content: "Creates a footer object for a Discord embed." })
@Parameter({
    runtimeName: "Text",
    name: [{ code: "en-US", content: "Footer text" }],
    description: [{ code: "en-US", content: "The footer text." }],
})
@Parameter({
    runtimeName: "IconUrl",
    name: [{ code: "en-US", content: "Footer icon URL" }],
    description: [{ code: "en-US", content: "Optional URL for the footer icon." }],
    optional: true
})
export class CreateDiscordEmbedFooterFunction {
    run(_context: unknown, Text: string, IconUrl?: string): DiscordEmbedFooterData {
        return {
            text: Text,
            iconUrl: IconUrl,
        };
    }
}
