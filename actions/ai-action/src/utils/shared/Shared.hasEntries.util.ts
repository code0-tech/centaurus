export function hasEntries(value: Record<string, unknown> | undefined): boolean {
    return value !== undefined && Object.keys(value).length > 0;
}
