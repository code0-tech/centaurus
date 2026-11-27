import {
    APIMessage,
    APIUser,
    User,
    GuildMember,
    Message,
    Channel,
    Client,
    Guild,
    MessageReaction,
    PartialGuildMember,
    Role,
    SendableChannels,
    ChannelType as DiscordJsChannelType,
    EmbedBuilder,
    DiscordAPIError,
} from "discord.js";
import { PlainValue, RuntimeError } from "@code0-tech/hercules";
import { DiscordUserType } from "./data_types/discordUser.js";
import { DiscordGuildMemberType } from "./data_types/discordGuildMember.js";
import { DiscordMessageType } from "./data_types/discordMessage.js";
import { DiscordChannelDataType, DiscordChannelTypeType } from "./data_types/discordChannel.js";
import { DiscordGuildType } from "./data_types/discordGuild.js";
import { DiscordRoleType } from "./data_types/discordRole.js";
import { DiscordReactionType } from "./data_types/discordReaction.js";
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
            case 50027:
                // Discord invalidates an interaction token 15 minutes after the
                // command was used, so this is a flow that answered too late.
                throw new RuntimeError(
                    "DISCORD_INTERACTION_EXPIRED",
                    `The slash command can no longer be answered, Discord closed the 15 minute answer window: ${msg}`
                );
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

/**
 * The mappers below fill every field a data type declares, using `null` for
 * what Discord did not send. A field that is missing from the payload has no
 * reference in the flow's value store, so a flow reading e.g.
 * `referencedMessageId` of a message without a reply would fail - an explicit
 * null gives it something to read.
 */
export function mapDiscordUser(user: User): DiscordUserType {
    return {
        id: user.id,
        username: user.username,
        globalName: user.globalName ?? null,
        avatar: user.avatarURL() ?? null,
        bot: user.bot,
    };
}

export function mapDiscordGuildMember(member: GuildMember | PartialGuildMember): DiscordGuildMemberType {
    return {
        user: mapDiscordUser(member.user),
        nickname: member.nickname ?? null,
        roles: Array.from(member.roles.cache.keys()),
        joinedAt: member.joinedAt?.toISOString() ?? null,
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
        guildId: ch.guildId ?? ch.guild?.id ?? null,
        name: ch.name ?? "DM",
        type: mapChannelType(ch.type),
        topic: ch.topic ?? null,
        parentId: ch.parentId ?? null,
    };
}

export function mapDiscordGuild(guild: Guild): DiscordGuildType {
    return {
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL() ?? null,
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

export function mapDiscordReaction(reaction: MessageReaction, user: User): DiscordReactionType {
    return {
        emoji: reaction.emoji.name ?? reaction.emoji.id ?? "",
        messageId: reaction.message.id,
        channelId: reaction.message.channelId,
        user: mapDiscordUser(user),
    };
}

export function mapDiscordMessage(msg: Message): DiscordMessageType {
    const embeds: DiscordEmbedType[] = msg.embeds.map((e) => ({
        title: e.title ?? null,
        description: e.description ?? null,
        url: e.url ?? null,
        color: e.color ?? null,
        timestamp: e.timestamp ? new Date(e.timestamp).toISOString() : null,
        footer: e.footer ? { text: e.footer.text, iconUrl: e.footer.iconURL ?? null } : null,
        imageUrl: e.image?.url ?? null,
        thumbnailUrl: e.thumbnail?.url ?? null,
        author: e.author
            ? { name: e.author.name, url: e.author.url ?? null, iconUrl: e.author.iconURL ?? null }
            : null,
        fields: e.fields.map((f) => ({ name: f.name, value: f.value, inline: f.inline ?? null })),
    }));

    const attachments: DiscordAttachmentType[] = Array.from(msg.attachments.values()).map((a) => ({
        id: a.id,
        filename: a.name,
        contentType: a.contentType ?? null,
        size: a.size,
        url: a.url,
    }));

    return {
        id: msg.id,
        channelId: msg.channelId,
        guildId: msg.guildId ?? null,
        author: mapDiscordUser(msg.author),
        content: msg.content,
        embeds,
        attachments,
        mentions: Array.from(msg.mentions.users.keys()),
        referencedMessageId: msg.reference?.messageId ?? null,
        createdAt: msg.createdAt.toISOString(),
    };
}

/**
 * Map a message as the REST API returns it. Answering a slash command writes to
 * an interaction webhook, which hands back raw API JSON instead of a client
 * structure - the result has to be the same DISCORD_MESSAGE a flow gets from
 * every other function.
 */
export function mapApiMessage(message: APIMessage): DiscordMessageType {
    const embeds: DiscordEmbedType[] = (message.embeds ?? []).map((embed) => ({
        title: embed.title ?? null,
        description: embed.description ?? null,
        url: embed.url ?? null,
        color: embed.color ?? null,
        timestamp: embed.timestamp ? new Date(embed.timestamp).toISOString() : null,
        footer: embed.footer ? { text: embed.footer.text, iconUrl: embed.footer.icon_url ?? null } : null,
        imageUrl: embed.image?.url ?? null,
        thumbnailUrl: embed.thumbnail?.url ?? null,
        author: embed.author
            ? { name: embed.author.name, url: embed.author.url ?? null, iconUrl: embed.author.icon_url ?? null }
            : null,
        fields: (embed.fields ?? []).map((field) => ({
            name: field.name,
            value: field.value,
            inline: field.inline ?? null,
        })),
    }));

    const attachments: DiscordAttachmentType[] = (message.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        filename: attachment.filename,
        contentType: attachment.content_type ?? null,
        size: attachment.size,
        url: attachment.url,
    }));

    return {
        id: message.id,
        channelId: message.channel_id,
        // Discord sends guild_id for a message in a server, but it is not part
        // of the typed message object.
        guildId: (message as { guild_id?: string }).guild_id ?? null,
        author: mapApiUser(message.author),
        content: message.content ?? "",
        embeds,
        attachments,
        mentions: (message.mentions ?? []).map((user) => user.id),
        referencedMessageId: message.message_reference?.message_id ?? null,
        createdAt: new Date(message.timestamp).toISOString(),
    };
}

function mapApiUser(user: APIUser): DiscordUserType {
    return {
        id: user.id,
        username: user.username,
        globalName: user.global_name ?? null,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp` : null,
        bot: user.bot ?? false,
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

/**
 * Fetch a channel the bot can post in. Everything the messaging functions do
 * needs a text based channel, so a voice channel or category is rejected here
 * instead of failing later with a Discord API error.
 */
export async function fetchChannel(client: Client, channelId: string): Promise<Channel> {
    let channel: Channel | null;
    try {
        channel = await client.channels.fetch(channelId);
    } catch (error) {
        return handleDiscordError(error, "DISCORD_UNKNOWN_CHANNEL", `Could not fetch channel ${channelId}.`);
    }

    if (!channel) {
        throw new RuntimeError("DISCORD_UNKNOWN_CHANNEL", `Channel ${channelId} was not found.`);
    }

    return channel;
}

export async function fetchTextChannel(client: Client, channelId: string): Promise<SendableChannels> {
    const channel = await fetchChannel(client, channelId);

    if (!channel.isSendable()) {
        throw new RuntimeError("DISCORD_INVALID_CHANNEL_TYPE", `Channel ${channelId} is not a text channel.`);
    }

    return channel;
}

export async function fetchMessage(client: Client, channelId: string, messageId: string): Promise<Message> {
    const channel = await fetchTextChannel(client, channelId);

    try {
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            throw new RuntimeError("DISCORD_UNKNOWN_MESSAGE", `Message ${messageId} was not found.`);
        }
        return message;
    } catch (error) {
        return handleDiscordError(error, "DISCORD_UNKNOWN_MESSAGE", `Could not fetch message ${messageId}.`);
    }
}

export async function fetchGuild(client: Client, guildId: string): Promise<Guild> {
    try {
        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            throw new RuntimeError("DISCORD_UNKNOWN_GUILD", `Server ${guildId} was not found.`);
        }

        return guild;
    } catch (error) {
        return handleDiscordError(error, "DISCORD_UNKNOWN_GUILD", `Could not fetch server ${guildId}.`);
    }
}


export async function fetchGuildMember(client: Client, guildId: string, userId: string): Promise<GuildMember> {
    const guild = await fetchGuild(client, guildId);

    try {
        const member = await guild.members.fetch(userId);
        if (!member) {
            throw new RuntimeError("DISCORD_UNKNOWN_MEMBER", `Member ${userId} was not found in server ${guildId}.`);
        }

        return member;
    } catch (error) {
        return handleDiscordError(error, "DISCORD_UNKNOWN_MEMBER", `Could not fetch member ${userId}.`);
    }
}

/**
 * Build the message payload for a send/reply/edit call. An embed is optional and
 * is skipped when it carries no renderable content.
 */
export function buildMessagePayload(content?: string, embed?: unknown): { content?: string; embeds?: EmbedBuilder[] } {
    const builder = embed ? createDiscordEmbedBuilder(embed) : null;
    const text = cleanString(content);

    if (!text && !builder) {
        throw new RuntimeError(
            "DISCORD_EMPTY_MESSAGE",
            "A Discord message needs either text content or an embed with content."
        );
    }

    return {
        content: text,
        embeds: builder ? [builder] : undefined,
    };
}

/**
 * Replace `undefined` with `null` throughout a payload. A protobuf Value has no
 * representation for `undefined`, and a key that never reaches Aquila has no
 * reference in the execution value store - a flow reading it fails with
 * `ReferenceValueNotFound`. The mappers already use null, so this only guards
 * payloads built by hand.
 */
export function toEventPayload<T>(value: T): PlainValue {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) return value.map((entry) => toEventPayload(entry));
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, toEventPayload(entry)])
        );
    }

    return value as PlainValue;
}
