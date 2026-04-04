import {ZodObject} from "zod";
import {createAuxiliaryTypeStore, printNode, zodToTs} from "zod-to-ts";
import * as ts from "typescript";

export function singleZodSchemaToTypescriptDef(
    typeName: string,
    zodSchema: ZodObject<any>
) {
    return zodSchemaToTypescriptDefs(typeName, zodSchema).get(typeName)!;
}

export function zodSchemaToTypescriptDefs(
    typeName: string,
    zodSchema: ZodObject<any>,
    extraSchemas: Record<string, any> = {}
): Map<string, string> {
    const store = createAuxiliaryTypeStore();
    const result = new Map<string, string>();

    for (const [name, schema] of Object.entries(extraSchemas)) {
        const {node} = zodToTs(schema, {auxiliaryTypeStore: store});

        const alias = ts.factory.createTypeAliasDeclaration(
            undefined,
            ts.factory.createIdentifier(name),
            undefined,
            node
        );

        store.definitions.set(schema, {
            identifier: ts.factory.createIdentifier(name),
            node: alias
        });

        result.set(name, printNode(alias).replace(`type ${name} =`, ``));
    }

    const {node} = zodToTs(zodSchema, {auxiliaryTypeStore: store});
    result.set(typeName, printNode(node));

    return result;
}
