/**
 * What a sub flow tool is called with, in the order the sub flow declares.
 *
 * A sub flow is invoked positionally: hercules forwards whatever the callable is
 * called with to `executeSubFlow`, whose wire message carries an ordered list of
 * parameters and no names at all. A model, on the other hand, answers a tool call
 * with an object keyed by parameter name. The sub flow's input schema bridges the
 * two - its properties stand in the sub flow's parameter order, so the first
 * property is parameter 0 - and reading the object off it is the only way the names
 * the model used become positions again.
 *
 * A parameter the model left out becomes `null` in its place, because leaving it out
 * would move every parameter behind it one position forward. Only the trailing ones
 * are dropped, so a sub flow that handles its own optional parameters still sees
 * them as absent.
 *
 * Anything else - a schema that is not an object, a sub flow that declared none, an
 * argument that is not an object - is passed on as the single argument it already
 * is.
 */
export function toSubFlowArguments(args: unknown, schema: Record<string, unknown> | undefined): unknown[] {
    const properties: unknown = schema?.properties;
    if (typeof properties !== "object" || properties === null) return [args];

    const names: string[] = Object.keys(properties as Record<string, unknown>);
    if (names.length === 0) return [];
    if (typeof args !== "object" || args === null || Array.isArray(args)) return [args];

    const given = args as Record<string, unknown>;
    let count: number = names.length;
    while (count > 0 && given[names[count - 1]!] === undefined) count -= 1;
    return names.slice(0, count).map((name) => given[name] ?? null);
}
