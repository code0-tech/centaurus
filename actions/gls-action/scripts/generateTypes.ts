import {loadAllDefinitions} from "../src/helpers";
import {
    HerculesActionConfigurationDefinition,
    HerculesDataType, HerculesFlowType, HerculesRegisterFunctionParameter,
} from "@code0-tech/hercules";
import {Project, SymbolFlags, Type} from "ts-morph";


const state = {
    dataTypes: [] as HerculesDataType[],
    actionConfigurationDefinitions: [] as HerculesActionConfigurationDefinition[],
    runtimeFunctions: [] as HerculesRegisterFunctionParameter[],
    flowTypes: [] as HerculesFlowType[]
}


async function run() {
    await loadAllDefinitions({
        onError: () => {
        },
        connect: () => Promise.resolve([]),
        dispatchEvent: () => Promise.resolve(),
        getProjectActionConfigurations: () => [],
        config: {
            authToken: "",
            aquilaUrl: "",
            version: "",
            actionId: ""
        },
        fullyConnected: () => false,
        registerDataTypes: (...dataTypes) => {
            state.dataTypes = [
                ...dataTypes,
                ...state.dataTypes
            ]
            return Promise.resolve()
        },
        registerConfigDefinitions: (...actionConfigurations) => {
            state.actionConfigurationDefinitions = [
                ...actionConfigurations,
                ...state.actionConfigurationDefinitions
            ]
            return Promise.resolve()
        },
        registerFunctionDefinitions: (...functionDefinitions) => {
            state.runtimeFunctions = [
                ...functionDefinitions,
                ...state.runtimeFunctions
            ]
            return Promise.resolve()
        },
        registerFlowTypes: (...flowTypes) => {
            state.flowTypes = [
                ...state.flowTypes,
                ...flowTypes
            ]
            return Promise.resolve()
        }

    })
}

run().then(async () => {
    console.log(`---
title: Datatypes
description: All data types registered by the GLS Action — field references and descriptions.
---
import {TypeTable} from "fumadocs-ui/components/type-table";

# GLS Action Types

The GLS Action registers the following data types with the Hercules platform. These types are used as inputs and outputs
of the GLS functions and can be referenced in your flows.

--- 
    `)
    state.dataTypes.forEach(value => {
        value.type = `export type ${value.identifier} = ${value.type}`
            .replace(/ \| undefined/g, "")

        function breakDown(
            typeName: string,
            code: string
        ): Record<string, string> {
            const map: Record<string, string> = {};

            const project = new Project({useInMemoryFileSystem: true});
            const sourceFile = project.createSourceFile("example.ts", code);

            const typeAlias = sourceFile.getTypeAliasOrThrow(typeName);
            let rootType = typeAlias.getType();

            if (rootType.isArray()) {
                rootType = rootType.getArrayElementTypeOrThrow();
            }

            function buildType(type: Type, currentName: string): string {
                const props = type.getProperties();

                const lines: string[] = [];

                props.forEach(symbol => {
                    const name = symbol.getName();
                    const decl = symbol.getDeclarations()[0];
                    if (!decl) return;


                    let propType = symbol.getTypeAtLocation(decl);

                    // unwrap arrays
                    let isArray = false;
                    if (propType.isArray()) {
                        propType = propType.getArrayElementTypeOrThrow();
                        isArray = true;
                    }

                    let typeText: string;

                    if (propType.getText().startsWith("{")) {
                        const newName = `${currentName}$${name}`;

                        // recurse first
                        const nestedType = buildType(propType, newName);

                        map[newName] = `export type ${newName} = ${nestedType};`;

                        typeText = isArray ? `${newName}[]` : newName;
                    } else {
                        typeText = propType.getText(decl);
                    }

                    // JSDoc
                    const jsDocs = (decl as any).getJsDocs?.()
                        ?.map(d => d.getText())
                        .join("\n");

                    const docPrefix = jsDocs ? `${jsDocs}\n` : "";

                    lines.push(
                        `${docPrefix}${name}${symbol.hasFlags(SymbolFlags.Optional) ? "?" : ""}: ${typeText};`
                    );
                });

                return `{\n${lines.map(l => "    " + l).join("\n")}\n}`;
            }

            const finalType = buildType(rootType, typeName);

            map[typeName] = `export type ${typeName} = ${finalType};`;

            return map;
        }


        const broke = breakDown(value.identifier, value.type)
        const entries = Object.entries(broke).reverse();

        for (const [key, val] of entries) {
            let typeString = `
            `

            const project = new Project({useInMemoryFileSystem: true});
            const sourceFile = project.createSourceFile("example.ts", val);


            const typeAlias = sourceFile.getTypeAliasOrThrow(key);


            let type = typeAlias.getType()
            const array = typeAlias.getType().isArray()
            if (array) {
                type = type.getArrayElementTypeOrThrow()
            }
            let globalDocumentation: string

            type.getProperties().forEach(property => {
                const name = property.getName();

                const currType = property.getTypeAtLocation(typeAlias);
                const currTypeText = currType.getText();

                const docs = {
                    description: "No description set",
                    deprecated: false,
                    default: undefined,
                    link: undefined
                }


                property.getJsDocTags().forEach(info => {
                    info.getText().forEach(part => {
                        if (info.getName() === "global") {
                            globalDocumentation = (globalDocumentation || "") + "\n" + part.text.trim()
                            return
                        }
                        docs[info.getName()] = part.text.trim()
                    })

                })

                if (currTypeText.startsWith("GLS_")) {
                    docs.link = currTypeText.toLowerCase()
                        .replace(/-/g, "_")
                        .replace(/\$/g, "")
                        .replace("[]", "")
                }
                typeString += `${name}: {
                description: '${docs.description}',
                deprecated: ${docs.deprecated},
                required: ${!property.isOptional()}, ${docs.link ? `\ntypeDescriptionLink: '#${docs.link}',` : ""}
                type: '${currTypeText}', ${docs.default ? `\ndefault: ${docs.default}` : ""} 
            },
            `

            })

            const table = `<TypeTable type={{${typeString}}}
/>`
            console.log(`# ${key}`)
            console.log(globalDocumentation || "\nNo documentation provided for this type.")
            console.log()
            console.log(table)
        }
    })

})