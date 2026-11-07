import type { ActionFlow } from "@code0-tech/tucana/aquila";
import { toAllowedValue } from "@code0-tech/tucana/helpers";

/**
 * A flow setting as plain text, or undefined when it is unset or not text.
 *
 * Settings arrive as protobuf values, so reading one is this unwrapping step - and an
 * empty setting is treated as unset, because a route or a model name of "" names
 * nothing.
 */
export function textSetting(flow: ActionFlow, identifier: string): string | undefined {
    const setting = flow.settings.find((entry) => entry.flowSettingId.toLowerCase() === identifier);
    if (!setting?.value) return undefined;

    const value: unknown = toAllowedValue(setting.value);
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
