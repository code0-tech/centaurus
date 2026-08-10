import { WebhookClient, EmbedBuilder } from "discord.js";
import { FunctionContext } from "@code0-tech/hercules";
import { DiscordEmbedData } from "./data_types/discordEmbed.js";
import { DiscordWebhookResponseData } from "./data_types/discordWebhook.js";

function cleanString(val?: any): string | undefined {
    if (val === null || val === undefined) return undefined;
    const str = String(val).trim();
    return str.length > 0 ? str : undefined;
}

function cleanUrl(val?: any): string | undefined {
    const str = cleanString(val);
    if (!str) return undefined;
    if (str.startsWith("http://") || str.startsWith("https://")) {
        return str;
    }
    return undefined;
}

export function createDiscordEmbedBuilder(rawEmbed: any): EmbedBuilder | null {
    if (!rawEmbed) return null;

    let embedData = rawEmbed;
    if (typeof embedData === "string") {
        try {
            embedData = JSON.parse(embedData);
        } catch {
            return null;
        }
    }

    if (typeof embedData !== "object") return null;

    const builder = new EmbedBuilder();
    let hasContent = false;

    const title = cleanString(embedData.title);
    if (title) {
        builder.setTitle(title);
        hasContent = true;
    }

    const description = cleanString(embedData.description);
    if (description) {
        builder.setDescription(description);
        hasContent = true;
    }

    const url = cleanUrl(embedData.url);
    if (url) {
        builder.setURL(url);
    }

    if (embedData.color !== undefined && embedData.color !== null) {
        if (typeof embedData.color === "number" && !isNaN(embedData.color)) {
            builder.setColor(embedData.color);
        } else if (typeof embedData.color === "string") {
            let hex = embedData.color.trim();
            if (hex.startsWith("#")) {
                hex = hex.slice(1);
            } else if (hex.startsWith("0x") || hex.startsWith("0X")) {
                hex = hex.slice(2);
            }
            const colorNum = parseInt(hex, 16);
            if (!isNaN(colorNum) && colorNum >= 0 && colorNum <= 0xffffff) {
                builder.setColor(colorNum);
            }
        }
    }

    const timestampStr = cleanString(embedData.timestamp);
    if (timestampStr) {
        const date = new Date(timestampStr);
        if (!isNaN(date.getTime())) {
            builder.setTimestamp(date);
        }
    }

    const footer = embedData.footer;
    if (footer && typeof footer === "object") {
        const footerText = cleanString(footer.text);
        if (footerText) {
            const footerIcon = cleanUrl(footer.iconUrl || footer.icon_url || footer.iconURL);
            builder.setFooter({
                text: footerText,
                iconURL: footerIcon,
            });
            hasContent = true;
        }
    }

    const imageUrl = cleanUrl(
        embedData.imageUrl || embedData.image_url || (embedData.image && embedData.image.url)
    );
    if (imageUrl) {
        builder.setImage(imageUrl);
        hasContent = true;
    }

    const thumbnailUrl = cleanUrl(
        embedData.thumbnailUrl || embedData.thumbnail_url || (embedData.thumbnail && embedData.thumbnail.url)
    );
    if (thumbnailUrl) {
        builder.setThumbnail(thumbnailUrl);
        hasContent = true;
    }

    const author = embedData.author;
    if (author && typeof author === "object") {
        const authorName = cleanString(author.name);
        if (authorName) {
            const authorUrl = cleanUrl(author.url);
            const authorIcon = cleanUrl(author.iconUrl || author.icon_url || author.iconURL);
            builder.setAuthor({
                name: authorName,
                url: authorUrl,
                iconURL: authorIcon,
            });
            hasContent = true;
        }
    }

    if (Array.isArray(embedData.fields) && embedData.fields.length > 0) {
        const validFields = embedData.fields
            .map((f: any) => ({
                name: cleanString(f.name) || "",
                value: cleanString(f.value) || "",
                inline: Boolean(f.inline),
            }))
            .filter((f: any) => f.name.length > 0 && f.value.length > 0);

        if (validFields.length > 0) {
            builder.addFields(validFields);
            hasContent = true;
        }
    }

    return hasContent ? builder : null;
}

export async function sendDiscordWebhook(
    context: FunctionContext,
    webhookUrl?: string,
    content?: string,
    embed?: DiscordEmbedData,
    username?: string,
    avatarUrl?: string,
    tts?: boolean
): Promise<DiscordWebhookResponseData> {
    const configuredWebhookUrl = cleanString(context?.matchedConfig?.findConfig("webhook_url")) || "";
    const configuredUsername = cleanString(context?.matchedConfig?.findConfig("username")) || "";
    const configuredAvatarUrl = cleanString(context?.matchedConfig?.findConfig("avatar_url")) || "";

    const finalWebhookUrl = cleanUrl(webhookUrl) || cleanUrl(configuredWebhookUrl);
    const finalUsername = cleanString(username) || configuredUsername;
    const finalAvatarUrl = cleanUrl(avatarUrl) || cleanUrl(configuredAvatarUrl);
    const finalContent = cleanString(content);

    if (!finalWebhookUrl) {
        return {
            success: false,
            statusCode: 400,
            message: "Invalid or missing webhook URL.",
        };
    }

    try {
        const webhookClient = new WebhookClient({ url: finalWebhookUrl });

        const embeds: EmbedBuilder[] = [];
        if (embed) {
            const builder = createDiscordEmbedBuilder(embed);
            if (builder) {
                embeds.push(builder);
            }
        }

        if (!finalContent && embeds.length === 0) {
            webhookClient.destroy();
            return {
                success: false,
                statusCode: 400,
                message: "Cannot send an empty webhook message. Provide content or an embed.",
            };
        }

        try {
            await webhookClient.send({
                content: finalContent || undefined,
                username: finalUsername || undefined,
                avatarURL: finalAvatarUrl || undefined,
                tts: Boolean(tts),
                embeds: embeds.length > 0 ? embeds : undefined,
            });
        } finally {
            webhookClient.destroy();
        }

        return {
            success: true,
            statusCode: 200,
            message: "Webhook delivered successfully using discord.js.",
        };
    } catch (error: any) {
        console.error("Discord Webhook Execution Error:", error);
        const statusCode = error.status ?? error.statusCode ?? 500;
        const message = error.message || "Failed to execute Discord webhook via discord.js.";
        return {
            success: false,
            statusCode,
            message,
        };
    }
}
