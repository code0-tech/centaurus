import { RuntimeError } from "@code0-tech/hercules";

export function asText(value: unknown, parameter: string, errorCode: string): string {
    if (typeof value === "string") return value;
    throw new RuntimeError(
        errorCode,
        `The "${parameter}" parameter has to be a text, but a ${typeof value} was passed.`,
    );
}
