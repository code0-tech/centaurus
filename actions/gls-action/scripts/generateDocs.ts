import {loadAllDefinitions} from "../src/helpers";
import {
    ActionSdk,
    HerculesActionConfigurationDefinition,
    HerculesDataType, HerculesFlowType, HerculesRegisterFunctionParameter,
} from "@code0-tech/hercules";
import {Project, SymbolFlags, Type} from "ts-morph";
import {writeFileSync} from "fs"


const state = {
    dataTypes: [] as HerculesDataType[],
    actionConfigurationDefinitions: [] as HerculesActionConfigurationDefinition[],
    runtimeFunctions: [] as HerculesRegisterFunctionParameter[],
    flowTypes: [] as HerculesFlowType[]
}


async function run(): Promise<ActionSdk> {
    const sdk = {
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

    };
    await loadAllDefinitions(sdk)

    return sdk
}


function generateDatatypes(): string {
    let generatedDoc = ""

    generatedDoc += `---
title: Datatypes
description: All data types registered by the GLS Action.
---
import {TypeTable} from "fumadocs-ui/components/type-table";

# GLS Action Types

The GLS Action registers the following data types with the Hercules platform. These types are used as inputs and outputs
of the GLS functions and can be referenced in your flows.

--- 
    `

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
            generatedDoc += `
# ${key}${globalDocumentation || "\nNo documentation provided for this type."}

${table}
            `
        }
    })
    return generatedDoc
}

interface Translation {
    code?: string;
    content?: string;
}

interface FunctionDefinition {
    descriptions?: Array<Translation>;
    displayMessages?: Array<Translation>;
    identifier?: string;
    names?: Array<Translation>;
    parameterDefinitions?: {
        nodes: {
            identifier: string,
            descriptions: Array<Translation>,
            names: Array<Translation>
        }[]
    };
}

async function generateFunctions(sdk: ActionSdk): Promise<string> {
    async function loadFunctions(modules: Record<string, () => Promise<unknown>>) {
        for (const path in modules) {

            const mod: any = await modules[path]();
            if (typeof mod.default === 'function') {
                try {
                    await mod.default(sdk);
                } catch (error) {
                    console.log(`Error registering functions from ${path}:`, error);
                }
            }
        }
    }

    let generatedDoc = `---
title: Functions
description: All functions registered by the GLS Action.
---

The GLS Action exposes ${state.runtimeFunctions.length} functions grouped into three categories:

- **Builder functions** — Construct data objects (no API call)
- **Shipment functions** — Create different types of GLS shipments (calls GLS API)
- **API functions** — Query or modify shipments (calls GLS API)

---
`
    const functionGlobs = [
        import.meta.glob('../src/functions/utils/*.ts'),
        import.meta.glob('../src/functions/services/*.ts'),
        import.meta.glob('../src/functions/*.ts')
    ]
    for (let i = 0; i < functionGlobs.length; i++) {
        const modules = functionGlobs[i]
        state.runtimeFunctions = []
        await loadFunctions(modules)

        switch (i) {
            case 0: {
                generatedDoc += `
## Builder functions
                `
                break
            }
            case 1: {
                generatedDoc += `
## Shipment functions

All shipment functions accept a common set of parameters in addition to their type-specific parameters. They call the GLS ShipIT API (\`POST /rs/shipments\`) and return a \`GLS_CREATE_PARCELS_RESPONSE\`.

**Common parameters for all shipment functions:**

| Parameter         | Type                          | Required | Description                                        |
|-------------------|-------------------------------|----------|----------------------------------------------------|
| \`shipment\`        | GLS_SHIPMENT_WITHOUT_SERVICES | **Yes**  | Shipment data (consignee, shipper, units, product) |
| \`printingOptions\` | GLS_PRINTING_OPTIONS          | **Yes**  | Label format settings                              |
| \`returnOptions\`   | GLS_RETURN_OPTIONS            | No       | Whether to return print data and routing info      |
| \`customContent\`   | GLS_CUSTOM_CONTENT            | No       | Custom logo and barcode settings                   |

---
                `
                break
            }
            default: {
                generatedDoc += `
                ## API functions
                `
            }
        }

        state.runtimeFunctions.forEach(value => {
            const definition = value.definition;
            const generateDefinition: FunctionDefinition = {
                descriptions: definition.description,
                names: definition.name,
                identifier: definition.runtimeName,
                parameterDefinitions: {
                    nodes: definition.parameters.map(p => {
                        return {
                            names: p.name,
                            identifier: p.runtimeName,
                            descriptions: p.description
                        }
                    })
                },
                displayMessages: definition.displayMessage
            }

            generatedDoc += `
### \`${definition.runtimeName}\`

${definition.documentation?.at(0).content || ""}
        
<FunctionCard definition={
${JSON.stringify(generateDefinition, null, 4)}
        } />
        
---
`
        })
    }


    return generatedDoc
}

run().then(async (sdk) => {
    writeFileSync(
        "../../docs/Actions/GLS/types.mdx",
        generateDatatypes(),
        "utf8"
    )

    writeFileSync(
        "../../docs/Actions/GLS/functions.mdx",
        await generateFunctions(sdk),
        "utf-8"
    )
})
