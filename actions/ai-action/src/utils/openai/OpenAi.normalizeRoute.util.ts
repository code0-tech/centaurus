/**
 * A route as it is compared: leading slash, no trailing one.
 *
 * `/v1`, `v1/` and `/v1/` are the same endpoint, and a flow saying `/` serves the
 * project's root - so a flow is reachable however its route was typed.
 */
export function normalizeRoute(route: string): string {
    const trimmed: string = route.trim().replace(/\/+$/, "");
    if (trimmed.length === 0) return "";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
