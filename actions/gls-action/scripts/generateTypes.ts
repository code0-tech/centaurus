import {loadAllDefinitions} from "../src/helpers";
import {
    HerculesActionConfigurationDefinition,
    HerculesDataType, HerculesFlowType, HerculesRegisterFunctionParameter,
} from "@code0-tech/hercules";


const state = {
    dataTypes: [] as HerculesDataType[],
    actionConfigurationDefinitions: [] as HerculesActionConfigurationDefinition[],
    runtimeFunctions: [] as HerculesRegisterFunctionParameter[],
    flowTypes: [] as HerculesFlowType[]
}


async function run() {
    await loadAllDefinitions({
        onError: handler => {
        },
        connect: options => Promise.resolve([]),
        dispatchEvent: (event, payload) => Promise.resolve(),
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
            return Promise.resolve()
        }

    })
}

run().then(async () => {
    let typeContent = `---
title: Datatypes
description: All data types registered by the GLS Action — field references and descriptions.
---

# GLS Action Types

The GLS Action registers the following data types with the Hercules platform. These types are used as inputs and outputs
of the GLS functions and can be referenced in your flows.

--- 
    `

    state.dataTypes.forEach(value => {
        value.type = `export type ${value.identifier} = ${value.type}`
            .replace(/ \| undefined/g, "")
            .replace(/\/\*\*/g, "/**\n")
            .replace(/\*\//g, "\n**/")
            .replace(
                /(\w+)(\?)?:\s*(GLS_\w+);/g,
                (match, name, optionalMark, gls) => {
                    if (optionalMark) {
                        return `/**
 Optional.
 @fumadocsHref #type-table-temp.ts-${gls}
**/
${name}: ${gls}`;
                    }

                    return `/**
 @fumadocsHref #type-table-temp.ts-${gls}
**/
${name}: ${gls}`;
                }
            );

        let array = false
        if (value.type.endsWith("[];")) {
            value.type = value.type.slice(0, -3) + ";"
            array = true
        }

        typeContent += `
# ${value.identifier}${array ? " (array)" : ""}
        
<AutoTypeTable type={\`
        
${value.type}
        
\`} name="${value.identifier}"/>

`
    })
    typeContent = typeContent.replace(" | undefined", "")

    console.log(typeContent)
})

















