import {writeFileSync} from "fs"
import {
    ActionSdk,
    HerculesActionConfigurationDefinition,
    HerculesDataType,
    HerculesFlowType,
    HerculesRegisterFunctionParameter,
} from "@code0-tech/hercules"
import {Project, SymbolFlags, Type} from "ts-morph"

interface Translation {
    code?: string
    content?: string
}

interface FunctionDefinitionCard {
    descriptions?: Array<Translation>
    displayMessages?: Array<Translation>
    identifier?: string
    names?: Array<Translation>
    parameterDefinitions?: {
        nodes: {
            identifier: string
            descriptions: Array<Translation>
            names: Array<Translation>
        }[]
    }
}

interface RegistryState {
    dataTypes: HerculesDataType[]
    actionConfigurationDefinitions: HerculesActionConfigurationDefinition[]
    runtimeFunctions: HerculesRegisterFunctionParameter[]
    flowTypes: HerculesFlowType[]
}

interface FunctionGroup {
    heading: string
    modules: Record<string, () => Promise<unknown>>
    intro?: string
}

interface TypesCopy {
    title: string
    description: string
    heading: string
    intro: string
}

interface FunctionsCopy {
    title: string
    description: string
    intro: string
}

export interface StandardActionDocsConfig {
    actionName: string
    typePrefix: string
    typesOutputPath: string
    functionsOutputPath: string
    typesCopy: TypesCopy
    functionsCopy: FunctionsCopy
    functionGroups: FunctionGroup[]
    typeLinkOverrides?: Record<string, string>
    loadAllDefinitions: (sdk: ActionSdk) => Promise<void>
}

function createRegistry(): RegistryState {
    return {
        dataTypes: [],
        actionConfigurationDefinitions: [],
        runtimeFunctions: [],
        flowTypes: [],
    }
}

function createMockSdk(registry: RegistryState): ActionSdk {
    return {
        onError: () => {},
        connect: () => Promise.resolve([]),
        dispatchEvent: () => Promise.resolve(),
        getProjectActionConfigurations: () => [],
        config: {
            authToken: "",
            aquilaUrl: "",
            version: "",
            actionId: "",
        },
        fullyConnected: () => false,
        registerDataTypes: (...dataTypes) => {
            registry.dataTypes = [...dataTypes, ...registry.dataTypes]
            return Promise.resolve()
        },
        registerConfigDefinitions: (...actionConfigurations) => {
            registry.actionConfigurationDefinitions = [
                ...actionConfigurations,
                ...registry.actionConfigurationDefinitions,
            ]
            return Promise.resolve()
        },
        registerFunctionDefinitions: (...functionDefinitions) => {
            registry.runtimeFunctions = [...functionDefinitions, ...registry.runtimeFunctions]
            return Promise.resolve()
        },
        registerFlowTypes: (...flowTypes) => {
            registry.flowTypes = [...registry.flowTypes, ...flowTypes]
            return Promise.resolve()
        },
    }
}

function breakDownType(typeName: string, code: string): Record<string, string> {
    const map: Record<string, string> = {}
    const project = new Project({useInMemoryFileSystem: true})
    const sourceFile = project.createSourceFile("example.ts", code)

    const typeAlias = sourceFile.getTypeAliasOrThrow(typeName)
    let rootType = typeAlias.getType()

    if (rootType.isArray()) {
        rootType = rootType.getArrayElementTypeOrThrow()
    }

    function buildType(type: Type, currentName: string): string {
        const lines: string[] = []

        type.getProperties().forEach(symbol => {
            const name = symbol.getName()
            const decl = symbol.getDeclarations()[0]
            if (!decl) {
                return
            }

            let propType = symbol.getTypeAtLocation(decl)
            let isArray = false
            if (propType.isArray()) {
                propType = propType.getArrayElementTypeOrThrow()
                isArray = true
            }

            let typeText: string
            if (propType.getText().startsWith("{")) {
                const nestedName = `${currentName}$${name}`
                const nestedType = buildType(propType, nestedName)
                map[nestedName] = `export type ${nestedName} = ${nestedType};`
                typeText = isArray ? `${nestedName}[]` : nestedName
            } else {
                typeText = propType.getText(decl)
            }

            const jsDocs = (decl as any).getJsDocs?.()
                ?.map((doc: any) => doc.getText())
                .join("\n")
            const docPrefix = jsDocs ? `${jsDocs}\n` : ""
            lines.push(`${docPrefix}${name}${symbol.hasFlags(SymbolFlags.Optional) ? "?" : ""}: ${typeText};`)
        })

        return `{\n${lines.map(line => `    ${line}`).join("\n")}\n}`
    }

    const finalType = buildType(rootType, typeName)
    map[typeName] = `export type ${typeName} = ${finalType};`
    return map
}

function normalizeAnchor(typeName: string): string {
    return typeName.toLowerCase().replace(/-/g, "_").replace(/\$/g, "").replace("[]", "")
}

function getTypeLink(typeName: string | null, config: StandardActionDocsConfig): string | null {
    if (!typeName) {
        return null
    }

    const override = config.typeLinkOverrides?.[typeName]
    const resolved = override || typeName

    if (!resolved.startsWith(config.typePrefix)) {
        return resolved
    }

    return `[${resolved}](./types.mdx#${normalizeAnchor(resolved)})`
}

function generateDatatypes(config: StandardActionDocsConfig, registry: RegistryState): string {
    let generatedDoc = `---
title: ${config.typesCopy.title}
description: ${config.typesCopy.description}
---
import {TypeTable} from "fumadocs-ui/components/type-table";

# ${config.typesCopy.heading}

${config.typesCopy.intro}

---
`

    registry.dataTypes.forEach(value => {
        value.type = `export type ${value.identifier} = ${value.type}`.replace(/ \| undefined/g, "")

        const parts = breakDownType(value.identifier, value.type)
        const entries = Object.entries(parts).reverse()

        entries.forEach(([key, rawType]) => {
            let typeString = "\n"
            let globalDocumentation = ""

            const project = new Project({useInMemoryFileSystem: true})
            const sourceFile = project.createSourceFile("example.ts", rawType)
            const typeAlias = sourceFile.getTypeAliasOrThrow(key)

            let parsedType = typeAlias.getType()
            if (parsedType.isArray()) {
                parsedType = parsedType.getArrayElementTypeOrThrow()
            }

            parsedType.getProperties().forEach(property => {
                const propertyType = property.getTypeAtLocation(typeAlias)
                const propertyTypeText = propertyType.getText()

                const docs: Record<string, unknown> = {
                    description: "No description set",
                    deprecated: false,
                    default: undefined,
                    link: undefined,
                }

                property.getJsDocTags().forEach(tag => {
                    tag.getText().forEach(part => {
                        if (tag.getName() === "global") {
                            globalDocumentation = `${globalDocumentation}\n${part.text.trim()}`
                            return
                        }
                        docs[tag.getName()] = part.text.trim()
                    })
                })

                if (propertyTypeText.startsWith(config.typePrefix)) {
                    docs.link = normalizeAnchor(propertyTypeText)
                }

                typeString += `${property.getName()}: {
                description: '${docs.description}',
                deprecated: ${docs.deprecated},
                required: ${!property.isOptional()}, ${docs.link ? `\ntypeDescriptionLink: '#${docs.link}',` : ""}
                type: '${propertyTypeText}', ${docs.default ? `\ndefault: ${docs.default}` : ""}
            },
            `
            })

            generatedDoc += `
# ${key}${globalDocumentation || "\nNo documentation provided for this type."}

<TypeTable type={{${typeString}}}
/>
            `
        })
    })

    return generatedDoc
}

function getParamInfo(signature: string, paramName: string): { optional: boolean; type: string | null } {
    const paramsMatch = signature.match(/\((.*)\)/s)
    if (!paramsMatch) {
        return {optional: false, type: null}
    }

    const params = paramsMatch[1].split(",")
    for (const param of params) {
        const trimmed = param.trim()
        const match = trimmed.match(new RegExp(`${paramName}\\s*(\\?)?\\s*:\\s*(.+)`))
        if (match) {
            return {
                optional: match[1] === "?",
                type: match[2].trim(),
            }
        }
    }

    return {optional: false, type: null}
}

function generateMarkdownTable(headers: string[], rows: string[][]): string {
    const headerRow = `| ${headers.join(" | ")} |`
    const separator = `| ${headers.map(() => "---").join(" | ")} |`
    const bodyRows = rows.map(row => `| ${row.join(" | ")} |`)
    return [headerRow, separator, ...bodyRows].join("\n")
}

async function loadFunctions(
    modules: Record<string, () => Promise<unknown>>,
    sdk: ActionSdk,
    registry: RegistryState,
): Promise<void> {
    for (const path in modules) {
        const mod: any = await modules[path]()
        if (typeof mod.default !== "function") {
            continue
        }

        try {
            await mod.default(sdk)
        } catch (error) {
            console.log(`Error registering functions from ${path}:`, error)
        }
    }

    registry.runtimeFunctions = [...registry.runtimeFunctions]
}

async function generateFunctions(config: StandardActionDocsConfig, sdk: ActionSdk, registry: RegistryState): Promise<string> {
    let generatedDoc = `---
title: ${config.functionsCopy.title}
description: ${config.functionsCopy.description}
---

${config.functionsCopy.intro}

---
`

    for (const group of config.functionGroups) {
        registry.runtimeFunctions = []
        await loadFunctions(group.modules, sdk, registry)

        generatedDoc += `
## ${group.heading}
${group.intro ? `\n${group.intro}\n` : ""}
`

        registry.runtimeFunctions.forEach(value => {
            const definition = value.definition
            const card: FunctionDefinitionCard = {
                descriptions: definition.description,
                names: definition.name,
                identifier: definition.runtimeName,
                parameterDefinitions: {
                    nodes: definition.parameters.map(parameter => ({
                        names: parameter.name,
                        identifier: parameter.runtimeName,
                        descriptions: parameter.description,
                    })),
                },
                displayMessages: definition.displayMessage,
            }

            const headers = ["Parameter", "Name", "Type", "Required", "Description"]
            const rows: string[][] = definition.parameters.map(parameter => {
                const paramInfo = getParamInfo(definition.signature, parameter.runtimeName)
                const linkedType = getTypeLink(paramInfo.type, config)

                return [
                    parameter.runtimeName,
                    parameter.name[0].content,
                    linkedType?.replace(/\|/g, "\\|") || "Unknown",
                    paramInfo.optional ? "No" : "Yes",
                    parameter.description[0].content,
                ]
            })

            const returnType = definition.signature.split("):")[1]?.trim()
            generatedDoc += `
### \`${definition.runtimeName}\`

${generateMarkdownTable(headers, rows)}

Return Type: ${getTypeLink(returnType || null, config) || "Unknown"}

#

${definition.documentation?.at(0)?.content || ""}

<FunctionCard definition={
${JSON.stringify(card, null, 4)}
} />

---
`
        })
    }

    return generatedDoc
}

export async function runStandardActionDocs(config: StandardActionDocsConfig): Promise<void> {
    const registry = createRegistry()
    const sdk = createMockSdk(registry)

    await config.loadAllDefinitions(sdk)

    const typesContent = generateDatatypes(config, registry)
    const functionsContent = await generateFunctions(config, sdk, registry)

    writeFileSync(config.typesOutputPath, typesContent, "utf8")
    writeFileSync(config.functionsOutputPath, functionsContent, "utf8")
}

