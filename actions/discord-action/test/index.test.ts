import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { RuntimeError } from "@code0-tech/hercules";
import { ChannelType } from "discord.js";

import { getDiscordClient } from "../src/client.js";
import {
    buildMessagePayload,
    cleanUrl,
    createDiscordEmbedBuilder,
    handleDiscordError,
    mapApiMessage,
    mapChannelType,
    mapDiscordGuildMember,
    mapDiscordMessage,
    mapDiscordReaction,
    toEventPayload,
} from "../src/helpers.js";
import { DiscordGuildMemberSchema } from "../src/data_types/discordGuildMember.js";
import { DiscordReactionSchema } from "../src/data_types/discordReaction.js";
import { DiscordMessageSchema } from "../src/data_types/discordMessage.js";

import { DiscordSendMessageFunction } from "../src/functions/messaging/discordSendMessage.js";
import { DiscordSendDirectMessageFunction } from "../src/functions/messaging/discordSendDirectMessage.js";
import { DiscordReplyToMessageFunction } from "../src/functions/messaging/discordReplyToMessage.js";
import { DiscordEditMessageFunction } from "../src/functions/messaging/discordEditMessage.js";
import { DiscordDeleteMessageFunction } from "../src/functions/messaging/discordDeleteMessage.js";
import { DiscordAddReactionFunction } from "../src/functions/messaging/discordAddReaction.js";
import { DiscordAnswerSlashCommandFunction } from "../src/functions/messaging/discordAnswerSlashCommand.js";
import { DiscordGetMessageFunction } from "../src/functions/messaging/discordGetMessage.js";
import { DiscordGetMessagesFunction } from "../src/functions/messaging/discordGetMessages.js";
import { DiscordGetChannelFunction } from "../src/functions/channels/discordGetChannel.js";
import { DiscordGetChannelsFunction } from "../src/functions/channels/discordGetChannels.js";
import { DiscordGetGuildFunction } from "../src/functions/guilds/discordGetGuild.js";
import { DiscordGetRolesFunction } from "../src/functions/guilds/discordGetRoles.js";
import { DiscordGetGuildMemberFunction } from "../src/functions/members/discordGetGuildMember.js";
import { DiscordGetGuildMembersFunction } from "../src/functions/members/discordGetGuildMembers.js";
import { DiscordGetUserFunction } from "../src/functions/users/discordGetUser.js";
import { DiscordAddRoleToMemberFunction } from "../src/functions/members/discordAddRoleToMember.js";
import { DiscordRemoveRoleFromMemberFunction } from "../src/functions/members/discordRemoveRoleFromMember.js";

import { DiscordMessageCreated } from "../src/events/discordMessageCreated.js";
import { DiscordReactionAdded } from "../src/events/discordReactionAdded.js";
import { DiscordMemberJoined } from "../src/events/discordMemberJoined.js";
import { DiscordMemberLeft } from "../src/events/discordMemberLeft.js";
import { DiscordSlashCommandInvoked } from "../src/events/discordSlashCommandInvoked.js";

const functions = [
    DiscordSendMessageFunction,
    DiscordSendDirectMessageFunction,
    DiscordReplyToMessageFunction,
    DiscordEditMessageFunction,
    DiscordDeleteMessageFunction,
    DiscordAddReactionFunction,
    DiscordAnswerSlashCommandFunction,
    DiscordAddRoleToMemberFunction,
    DiscordRemoveRoleFromMemberFunction,
    DiscordGetMessageFunction,
    DiscordGetMessagesFunction,
    DiscordGetChannelFunction,
    DiscordGetChannelsFunction,
    DiscordGetGuildFunction,
    DiscordGetRolesFunction,
    DiscordGetGuildMemberFunction,
    DiscordGetGuildMembersFunction,
    DiscordGetUserFunction,
];

const events = [
    DiscordMessageCreated,
    DiscordReactionAdded,
    DiscordMemberJoined,
    DiscordMemberLeft,
    DiscordSlashCommandInvoked,
];

describe("bot token", () => {
    it.each(functions)("is the first parameter of %o", (fn) => {
        const parameters = Reflect.getMetadata("hercules:function_parameters", fn) as { runtimeName: string }[];
        const signature = Reflect.getMetadata("hercules:signature", fn) as string;

        expect(parameters[0].runtimeName).toEqual("botToken");
        expect(parameters[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith("(botToken: string, ")).toBe(true);
    });

    it.each(events)("is the first setting of %o", (event) => {
        const settings = Reflect.getMetadata("hercules:flow_settings", event) as { identifier: string }[];
        const signature = Reflect.getMetadata("hercules:signature", event) as string;

        expect(settings[0].identifier).toEqual("botToken");
        expect(settings[0]).not.toHaveProperty("optional", true);
        expect(signature.startsWith("(botToken: string")).toBe(true);
    });

    it("is required to get a client", async () => {
        await expect(getDiscordClient("   ")).rejects.toBeInstanceOf(RuntimeError);
    });
});

describe("embeds", () => {
    it("parses a hex color with and without the leading hash", () => {
        expect(createDiscordEmbedBuilder({ title: "T", color: "#ff22ff" })!.toJSON().color).toEqual(0xff22ff);
        expect(createDiscordEmbedBuilder({ title: "T", color: "ff22ff" })!.toJSON().color).toEqual(0xff22ff);
    });

    it("keeps a numeric color", () => {
        expect(createDiscordEmbedBuilder({ title: "T", color: 0x70ffb2 })!.toJSON().color).toEqual(0x70ffb2);
    });

    it("drops empty urls instead of sending them", () => {
        const embed = createDiscordEmbedBuilder({ title: "T", url: "", author: { name: "John", url: "" } })!.toJSON();

        expect(embed.url).toBeUndefined();
        expect(embed.author?.name).toEqual("John");
        expect(embed.author?.url).toBeUndefined();
        expect(cleanUrl("example.com")).toBeUndefined();
    });

    it("has no builder without renderable content", () => {
        expect(createDiscordEmbedBuilder({})).toBeNull();
        expect(createDiscordEmbedBuilder("not json")).toBeNull();
    });
});

describe("message payload", () => {
    it("trims the content and attaches the embed", () => {
        const payload = buildMessagePayload("  hello  ", { title: "Title" });

        expect(payload.content).toEqual("hello");
        expect(payload.embeds?.[0].toJSON().title).toEqual("Title");
    });

    it("accepts an embed without content", () => {
        const payload = buildMessagePayload(undefined, { description: "Only an embed" });

        expect(payload.content).toBeUndefined();
        expect(payload.embeds).toHaveLength(1);
    });

    it("rejects a message that would be empty", () => {
        expect(() => buildMessagePayload("   ", undefined)).toThrow(RuntimeError);
        expect(() => buildMessagePayload(undefined, {})).toThrow(RuntimeError);
    });
});

describe("event payloads", () => {
    it("turns undefined fields into null so a flow can reference them", () => {
        const payload = toEventPayload({
            id: "1",
            guildId: undefined,
            nested: { topic: undefined, name: "general" },
            list: [{ inline: undefined }],
        });

        expect(payload).toEqual({
            id: "1",
            guildId: null,
            nested: { topic: null, name: "general" },
            list: [{ inline: null }],
        });
    });

    it("maps discord channel types to the data type values", () => {
        expect(mapChannelType(ChannelType.GuildText)).toEqual("text");
        expect(mapChannelType(ChannelType.PublicThread)).toEqual("thread");
        expect(mapChannelType(ChannelType.DM)).toEqual("dm");
        expect(mapChannelType(ChannelType.GuildStageVoice)).toEqual("unknown");
    });
});

describe("mapped payloads", () => {
    const fakeUser = { id: "3", username: "nicosammito", globalName: "Nico Sammito", avatarURL: () => null, bot: false };

    it("fills every field of a message, using null for what discord omitted", () => {
        const message = mapDiscordMessage({
            id: "1574748296709144649",
            channelId: "979757183623364681",
            guildId: null,
            author: fakeUser,
            content: "Test",
            embeds: [
                {
                    title: "T",
                    description: null,
                    url: null,
                    color: null,
                    timestamp: null,
                    footer: null,
                    image: null,
                    thumbnail: null,
                    author: null,
                    fields: [],
                },
            ],
            attachments: new Map(),
            mentions: { users: new Map() },
            reference: null,
            createdAt: new Date("2026-11-24T11:27:31.344Z"),
        } as any);

        // Every key the data type declares has to be in the payload, otherwise a
        // flow referencing it fails with ReferenceValueNotFound.
        expect(Object.keys(message).sort()).toEqual(Object.keys(DiscordMessageSchema.shape).sort());
        expect(message.referencedMessageId).toBeNull();
        expect(message.guildId).toBeNull();
        expect(message.author.avatar).toBeNull();
        expect(message.embeds[0]).toEqual({
            title: "T",
            description: null,
            url: null,
            color: null,
            timestamp: null,
            footer: null,
            imageUrl: null,
            thumbnailUrl: null,
            author: null,
            fields: [],
        });
        expect(DiscordMessageSchema.parse(message)).toBeTruthy();
    });

    it("fills every field of a reaction, naming the user who reacted", () => {
        const reaction = mapDiscordReaction(
            { emoji: { name: "👍", id: null }, message: { id: "1", channelId: "2" } } as any,
            fakeUser as any
        );

        expect(Object.keys(reaction).sort()).toEqual(Object.keys(DiscordReactionSchema.shape).sort());
        expect(reaction).toMatchObject({ emoji: "👍", messageId: "1", channelId: "2" });
        expect(reaction.user.username).toEqual("nicosammito");
        expect(DiscordReactionSchema.parse(reaction)).toBeTruthy();
    });

    it("falls back to the emoji id for a custom emoji without a name", () => {
        const reaction = mapDiscordReaction(
            { emoji: { name: null, id: "123456789" }, message: { id: "1", channelId: "2" } } as any,
            fakeUser as any
        );

        expect(reaction.emoji).toEqual("123456789");
    });

    it("fills every field of a guild member", () => {
        const member = mapDiscordGuildMember({
            user: fakeUser,
            nickname: null,
            roles: { cache: new Map([["979757183623364679", {}]]) },
            joinedAt: null,
            guild: { id: "979757183623364678" },
        } as any);

        expect(Object.keys(member).sort()).toEqual(Object.keys(DiscordGuildMemberSchema.shape).sort());
        expect(member.nickname).toBeNull();
        expect(member.joinedAt).toBeNull();
        expect(member.roles).toEqual(["979757183623364679"]);
        expect(DiscordGuildMemberSchema.parse(member)).toBeTruthy();
    });
});

describe("discord errors", () => {
    it("reports an expired interaction token as such", () => {
        expect(() => handleDiscordError({ code: 50027, message: "Invalid Webhook Token" })).toThrow(
            /DISCORD_INTERACTION_EXPIRED/
        );
    });

    it("keeps a runtime error it was handed", () => {
        const error = new RuntimeError("DISCORD_EMPTY_MESSAGE", "nothing to send");
        expect(() => handleDiscordError(error)).toThrow(/DISCORD_EMPTY_MESSAGE/);
    });
});

describe("mapApiMessage", () => {
    it("maps raw api json to the same shape the client mappers produce", () => {
        const message = mapApiMessage({
            id: "1574769900000000000",
            channel_id: "979757183623364681",
            guild_id: "979757183623364678",
            author: {
                id: "1574000000000000000",
                username: "CodeZero",
                global_name: null,
                avatar: "58c5c323ffacd81d890f8f7a37ade3a5",
                bot: true,
                discriminator: "0",
            },
            content: "Here is your result",
            timestamp: "2026-11-24T11:27:31.344000+00:00",
            edited_timestamp: null,
            tts: false,
            mention_everyone: false,
            mentions: [{ id: "456437986238791701" }],
            mention_roles: [],
            attachments: [
                { id: "7", filename: "report.pdf", size: 1024, url: "https://cdn.discordapp.com/report.pdf" },
            ],
            embeds: [
                {
                    title: "Result",
                    footer: { text: "CodeZero" },
                    fields: [{ name: "Status", value: "green", inline: true }],
                },
            ],
            pinned: false,
            type: 0,
        } as any);

        expect(Object.keys(message).sort()).toEqual(Object.keys(DiscordMessageSchema.shape).sort());
        expect(DiscordMessageSchema.parse(message)).toBeTruthy();
        expect(message).toMatchObject({
            id: "1574769900000000000",
            channelId: "979757183623364681",
            guildId: "979757183623364678",
            content: "Here is your result",
            mentions: ["456437986238791701"],
            referencedMessageId: null,
            createdAt: "2026-11-24T11:27:31.344Z",
        });
        expect(message.author).toEqual({
            id: "1574000000000000000",
            username: "CodeZero",
            globalName: null,
            avatar: "https://cdn.discordapp.com/avatars/1574000000000000000/58c5c323ffacd81d890f8f7a37ade3a5.webp",
            bot: true,
        });
        expect(message.attachments[0].contentType).toBeNull();
        expect(message.embeds[0]).toEqual({
            title: "Result",
            description: null,
            url: null,
            color: null,
            timestamp: null,
            footer: { text: "CodeZero", iconUrl: null },
            imageUrl: null,
            thumbnailUrl: null,
            author: null,
            fields: [{ name: "Status", value: "green", inline: true }],
        });
    });
});
