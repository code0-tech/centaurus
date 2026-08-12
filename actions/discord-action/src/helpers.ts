import {
    User,
    GuildMember,
    Message,
    Channel,
    Guild,
    Role,
    ChannelType as DiscordJsChannelType,
    EmbedBuilder,
    DiscordAPIError,
} from "discord.js";
import { RuntimeError } from "@code0-tech/hercules";
import { DiscordUserType } from "./data_types/discordUser.js";
import { DiscordGuildMemberType } from "./data_types/discordGuildMember.js";
import { DiscordMessageType } from "./data_types/discordMessage.js";
import { DiscordChannelDataType, DiscordChannelTypeType } from "./data_types/discordChannel.js";
import { DiscordGuildType } from "./data_types/discordGuild.js";
import { DiscordRoleType } from "./data_types/discordRole.js";
import { DiscordAttachmentType } from "./data_types/discordAttachment.js";
import { DiscordEmbedType } from "./data_types/discordEmbed.js";

export function handleDiscordError(
    error: any,
    fallbackCode = "DISCORD_ERROR",
    fallbackMessage = "A Discord API error occurred."
): never {
    if (error instanceof DiscordAPIError || (error && typeof error.code === "number")) {
        const code = error.code;
        const msg = error.message || fallbackMessage;
        switch (code) {
            case 10003:
                throw new RuntimeError("DISCORD_UNKNOWN_CHANNEL", `Unknown channel: ${msg}`);
            case 10008:
                throw new RuntimeError("DISCORD_UNKNOWN_MESSAGE", `Unknown message: ${msg}`);
            case 10013:
                throw new RuntimeError("DISCORD_UNKNOWN_USER", `Unknown user: ${msg}`);
            case 10007:
                throw new RuntimeError("DISCORD_UNKNOWN_MEMBER", `Unknown member: ${msg}`);
            case 10004:
                throw new RuntimeError("DISCORD_UNKNOWN_GUILD", `Unknown guild: ${msg}`);
            case 10011:
                throw new RuntimeError("DISCORD_UNKNOWN_ROLE", `Unknown role: ${msg}`);
            case 50013:
                throw new RuntimeError("DISCORD_MISSING_PERMISSIONS", `Missing permissions: ${msg}`);
            case 50001:
                throw new RuntimeError("DISCORD_MISSING_ACCESS", `Missing access: ${msg}`);
            case 50035:
                throw new RuntimeError("DISCORD_INVALID_FORM_BODY", `Invalid form body: ${msg}`);
            default:
                throw new RuntimeError(`DISCORD_API_ERROR_${code}`, msg);
        }
    }

    if (error instanceof RuntimeError) {
        throw error;
    }

    if (typeof error === "string") {
        throw new RuntimeError(fallbackCode, error);
    }

    throw new RuntimeError(fallbackCode, error?.message || fallbackMessage);
}

export function cleanString(val?: any): string | undefined {
    if (val === null || val === undefined) return undefined;
    const str = String(val).trim();
    return str.length > 0 ? str : undefined;
}

export function cleanUrl(val?: any): string | undefined {
    const str = cleanString(val);
    if (!str) return undefined;
    if (str.startsWith("http://") || str.startsWith("https://")) {
        return str;
    }
    return undefined;
}

export function mapDiscordUser(user: User): DiscordUserType {
    return {
        id: user.id,
        username: user.username,
        globalName: user.globalName || undefined,
        avatar: user.avatarURL() || undefined,
        bot: user.bot,
    };
}

export function mapDiscordGuildMember(member: GuildMember): DiscordGuildMemberType {
    return {
        user: mapDiscordUser(member.user),
        nickname: member.nickname || undefined,
        roles: Array.from(member.roles.cache.keys()),
        joinedAt: member.joinedAt?.toISOString(),
        guildId: member.guild.id,
    };
}

export function mapChannelType(type: DiscordJsChannelType): DiscordChannelTypeType {
    switch (type) {
        case DiscordJsChannelType.GuildText:
            return "text";
        case DiscordJsChannelType.GuildVoice:
            return "voice";
        case DiscordJsChannelType.GuildCategory:
            return "category";
        case DiscordJsChannelType.GuildAnnouncement:
            return "announcement";
        case DiscordJsChannelType.PublicThread:
        case DiscordJsChannelType.PrivateThread:
        case DiscordJsChannelType.AnnouncementThread:
            return "thread";
        case DiscordJsChannelType.GuildForum:
            return "forum";
        case DiscordJsChannelType.DM:
        case DiscordJsChannelType.GroupDM:
            return "dm";
        default:
            return "unknown";
    }
}

export function mapDiscordChannel(channel: Channel): DiscordChannelDataType {
    const ch = channel as any;
    return {
        id: channel.id,
        guildId: ch.guildId || ch.guild?.id || undefined,
        name: ch.name || "DM",
        type: mapChannelType(ch.type),
        topic: ch.topic || undefined,
        parentId: ch.parentId || undefined,
    };
}

export function mapDiscordGuild(guild: Guild): DiscordGuildType {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL() || undefined,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount,
    };
}

export function mapDiscordRole(role: Role): DiscordRoleType {
    return {
        id: role.id,
        guildId: role.guild.id,
        name: role.name,
        color: role.color,
        position: role.position,
    };
}

export function mapDiscordMessage(msg: Message): DiscordMessageType {
    const embeds: DiscordEmbedType[] = msg.embeds.map((e) => ({
        title: e.title || undefined,
        description: e.description || undefined,
        url: e.url || undefined,
        color: e.color || undefined,
        timestamp: e.timestamp ? new Date(e.timestamp).toISOString() : undefined,
        footer: e.footer ? { text: e.footer.text, iconUrl: e.footer.iconURL || undefined } : undefined,
        imageUrl: e.image?.url || undefined,
        thumbnailUrl: e.thumbnail?.url || undefined,
        author: e.author ? { name: e.author.name, url: e.author.url || undefined, iconUrl: e.author.iconURL || undefined } : undefined,
        fields: e.fields ? e.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline })) : undefined,
    }));

    const attachments: DiscordAttachmentType[] = Array.from(msg.attachments.values()).map((a) => ({
        id: a.id,
        filename: a.name,
        contentType: a.contentType || undefined,
        size: a.size,
        url: a.url,
    }));

    return {
        id: msg.id,
        channelId: msg.channelId,
        guildId: msg.guildId || undefined,
        author: mapDiscordUser(msg.author),
        content: msg.content,
        embeds,
        attachments,
        mentions: Array.from(msg.mentions.users.keys()),
        referencedMessageId: msg.reference?.messageId || undefined,
        createdAt: msg.createdAt.toISOString(),
    };
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
