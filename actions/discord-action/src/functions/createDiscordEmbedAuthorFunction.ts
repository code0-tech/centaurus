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
import { DiscordEmbedAuthorData } from "../data_types/discordEmbed.js";

@Identifier("createDiscordEmbedAuthor")
@Signature("(Name: string, Url?: string, IconUrl?: string): DISCORD_EMBED_AUTHOR")
@Name({ code: "en-US", content: "Create Embed Author" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Create Author ${Name}" })
@Documentation({
    code: "en-US",
    content: "Creates an author object for a Discord embed.",
})
@Description({ code: "en-US", content: "Creates an author object for a Discord embed." })
@Parameter({
    runtimeName: "Name",
    name: [{ code: "en-US", content: "Author name" }],
    description: [{ code: "en-US", content: "The name of the author." }],
})
@Parameter({
    runtimeName: "Url",
    name: [{ code: "en-US", content: "Author URL" }],
    description: [{ code: "en-US", content: "Optional hyperlink for the author." }],
    optional: true
})
@Parameter({
    runtimeName: "IconUrl",
    name: [{ code: "en-US", content: "Author icon URL" }],
    description: [{ code: "en-US", content: "Optional avatar icon URL for the author." }],
    optional: true
})
export class CreateDiscordEmbedAuthorFunction {
    run(_context: unknown, Name: string, Url?: string, IconUrl?: string): DiscordEmbedAuthorData {
        return {
            name: Name,
            url: Url,
            iconUrl: IconUrl,
        };
    }
}
