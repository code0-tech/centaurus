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
import {
    DiscordEmbedAuthorData,
    DiscordEmbedData,
    DiscordEmbedFooterData,
} from "../data_types/discordEmbed.js";

@Identifier("createDiscordEmbed")
@Signature("(Title?: string, Description?: string, Url?: string, Color?: string, Timestamp?: string, Footer?: DISCORD_EMBED_FOOTER, ImageUrl?: string, ThumbnailUrl?: string, Author?: DISCORD_EMBED_AUTHOR): DISCORD_EMBED")
@Name({ code: "en-US", content: "Create Embed" })
@DisplayIcon("simple:discord")
@DisplayMessage({ code: "en-US", content: "Create Embed" })
@Documentation({
    code: "en-US",
    content: "Creates a Discord embed object containing title, description, images, color, author, and footer.",
})
@Description({ code: "en-US", content: "Creates a Discord embed object." })
@Parameter({
    runtimeName: "Title",
    name: [{ code: "en-US", content: "Title" }],
    description: [{ code: "en-US", content: "Title of the embed." }],
})
@Parameter({
    runtimeName: "Description",
    name: [{ code: "en-US", content: "Description" }],
    description: [{ code: "en-US", content: "Description body of the embed." }],
})
@Parameter({
    runtimeName: "Url",
    name: [{ code: "en-US", content: "URL" }],
    description: [{ code: "en-US", content: "URL hyperlink for the embed title." }],
    optional: true
})
@Parameter({
    runtimeName: "Color",
    name: [{ code: "en-US", content: "Hex Color" }],
    description: [{ code: "en-US", content: "Hexadecimal color string (e.g. #70ffb2)." }],
    optional: true
})
@Parameter({
    runtimeName: "Timestamp",
    name: [{ code: "en-US", content: "Timestamp" }],
    description: [{ code: "en-US", content: "ISO 8601 timestamp string." }],
    optional: true
})
@Parameter({
    runtimeName: "Footer",
    name: [{ code: "en-US", content: "Footer" }],
    description: [{ code: "en-US", content: "Footer object for the embed." }],
    optional: true
})
@Parameter({
    runtimeName: "ImageUrl",
    name: [{ code: "en-US", content: "Image URL" }],
    description: [{ code: "en-US", content: "Main image URL inside the embed." }],
    optional: true
})
@Parameter({
    runtimeName: "ThumbnailUrl",
    name: [{ code: "en-US", content: "Thumbnail URL" }],
    description: [{ code: "en-US", content: "Thumbnail image URL inside the embed." }],
    optional: true
})
@Parameter({
    runtimeName: "Author",
    name: [{ code: "en-US", content: "Author" }],
    description: [{ code: "en-US", content: "Author object for the embed." }],
    optional: true
})
export class CreateDiscordEmbedFunction {
    run(
        _context: unknown,
        Title?: string,
        Description?: string,
        Url?: string,
        Color?: string,
        Timestamp?: string,
        Footer?: DiscordEmbedFooterData,
        ImageUrl?: string,
        ThumbnailUrl?: string,
        Author?: DiscordEmbedAuthorData
    ): DiscordEmbedData {
        return {
            title: Title,
            description: Description,
            url: Url,
            color: Color,
            timestamp: Timestamp,
            footer: Footer,
            imageUrl: ImageUrl,
            thumbnailUrl: ThumbnailUrl,
            author: Author,
        };
    }
}
