import "reflect-metadata";
import { Action, CodeZeroEvent } from "@code0-tech/hercules";

import { initDiscordClient } from "./client.js";

import {
    DiscordEmbedField,
    DiscordEmbedFooter,
    DiscordEmbedAuthor,
    DiscordEmbed,
} from "./data_types/discordEmbed.js";
import { DiscordChannelType, DiscordChannel } from "./data_types/discordChannel.js";
import { DiscordAttachment } from "./data_types/discordAttachment.js";
import { DiscordCommandInteraction } from "./data_types/discordCommandInteraction.js";
import { DiscordMessage } from "./data_types/discordMessage.js";
import { DiscordGuild } from "./data_types/discordGuild.js";
import { DiscordGuildMember } from "./data_types/discordGuildMember.js";
import { DiscordReaction } from "./data_types/discordReaction.js";
import { DiscordUser } from "./data_types/discordUser.js";
import { DiscordRole } from "./data_types/discordRole.js";

import { DiscordSendMessageFunction } from "./functions/messaging/discordSendMessage.js";
import { DiscordSendDirectMessageFunction } from "./functions/messaging/discordSendDirectMessage.js";
import { DiscordReplyToMessageFunction } from "./functions/messaging/discordReplyToMessage.js";
import { DiscordEditMessageFunction } from "./functions/messaging/discordEditMessage.js";
import { DiscordDeleteMessageFunction } from "./functions/messaging/discordDeleteMessage.js";
import { DiscordAddReactionFunction } from "./functions/messaging/discordAddReaction.js";
import { DiscordAddRoleToMemberFunction } from "./functions/members/discordAddRoleToMember.js";
import { DiscordRemoveRoleFromMemberFunction } from "./functions/members/discordRemoveRoleFromMember.js";

import { DiscordMessageCreated } from "./events/discordMessageCreated.js";
import { DiscordReactionAdded } from "./events/discordReactionAdded.js";
import { DiscordMemberJoined } from "./events/discordMemberJoined.js";
import { DiscordMemberLeft } from "./events/discordMemberLeft.js";
import { DiscordSlashCommandInvoked } from "./events/discordSlashCommandInvoked.js";

const action = new Action(
    process.env.ACTION_ID ?? "testing-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "simple:discord",
    "Discord bot integration: send and manage messages, reactions, and roles, and react to Discord events.",
    [{ code: "en-US", content: "Discord" }],
    []
);

action.registerDataTypeClass(DiscordEmbedField);
action.registerDataTypeClass(DiscordEmbedFooter);
action.registerDataTypeClass(DiscordEmbedAuthor);
action.registerDataTypeClass(DiscordEmbed);
action.registerDataTypeClass(DiscordChannelType);
action.registerDataTypeClass(DiscordChannel);
action.registerDataTypeClass(DiscordAttachment);
action.registerDataTypeClass(DiscordCommandInteraction);
action.registerDataTypeClass(DiscordMessage);
action.registerDataTypeClass(DiscordGuild);
action.registerDataTypeClass(DiscordGuildMember);
action.registerDataTypeClass(DiscordReaction);
action.registerDataTypeClass(DiscordUser);
action.registerDataTypeClass(DiscordRole);

action.registerRuntimeFunction(DiscordSendMessageFunction);
action.registerRuntimeFunction(DiscordSendDirectMessageFunction);
action.registerRuntimeFunction(DiscordReplyToMessageFunction);
action.registerRuntimeFunction(DiscordEditMessageFunction);
action.registerRuntimeFunction(DiscordDeleteMessageFunction);
action.registerRuntimeFunction(DiscordAddReactionFunction);
action.registerRuntimeFunction(DiscordAddRoleToMemberFunction);
action.registerRuntimeFunction(DiscordRemoveRoleFromMemberFunction);

action.registerRuntimeEventClass(DiscordMessageCreated);
action.registerRuntimeEventClass(DiscordReactionAdded);
action.registerRuntimeEventClass(DiscordMemberJoined);
action.registerRuntimeEventClass(DiscordMemberLeft);
action.registerRuntimeEventClass(DiscordSlashCommandInvoked);

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

initDiscordClient(process.env.DISCORD_BOT_TOKEN ?? "your_discord_bot_token_here", (err) => {
    action.emit(CodeZeroEvent.error, err);
}).catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, { depth: null });
    console.dir(action.configs.values(), { depth: null });
});

export { action };
