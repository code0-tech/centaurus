/**
 * What a browser needs before it may call the endpoint from a page, and what a client
 * sends a preflight for. The server is reached from other origins by design - a client
 * runs wherever it runs - so the headers are open.
 */
export const corsHeaders = (): Record<string, string> => ({
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, api-key",
    "access-control-max-age": "86400",
});
