import {
    loadFunctions,
    runStandardActionDocs,
    StandardActionDocsConfig
} from "../../../src/standardActionDocs"
import {loadAllDefinitions} from "../src/helpers";


export function createGlsDocsConfig(): StandardActionDocsConfig {
    return {
        actionName: "GLS",
        typePrefix: "GLS_",
        typesOutputPath: "../../docs/Actions/GLS/types.mdx",
        functionsOutputPath: "../../docs/Actions/GLS/functions.mdx",
        loadAllDefinitions,
        typeLinkOverrides: {
            GLS_SHIPMENT_UNIT_SERVICE: "GLS_SHIPMENT_UNIT$Service",
        },
        typesCopy: {
            title: "Datatypes",
            description: "All data types registered by the GLS Action.",
            heading: "GLS Action Types",
            intro: `The GLS Action registers the following data types with the Hercules platform. These types are used as inputs and outputs of the GLS functions and can be referenced in your flows.`,
        },
        functionsCopy: {
            title: "Functions",
            description: "All functions registered by the GLS Action.",
            intro: `The GLS Action exposes functions grouped into three categories:

- **Builder functions** — Construct data objects (no API call)
- **Shipment functions** — Create different types of GLS shipments (calls GLS API)
- **API functions** — Query or modify shipments (calls GLS API)`,
        },
        functionGroups: [
            {
                heading: "Builder functions",
                loadFunctions: (sdk) =>
                    loadFunctions(sdk, import.meta.glob("../src/functions/utils/*.ts")),
            },
            {
                heading: "Shipment functions",
                intro: `All shipment functions accept a common set of parameters in addition to their type-specific parameters. They call the GLS ShipIT API (\`POST /rs/shipments\`) and return a \`GLS_CREATE_PARCELS_RESPONSE\`.

**Common parameters for all shipment functions:**

| Parameter         | Type                          | Required | Description                                        |
|-------------------|-------------------------------|----------|----------------------------------------------------|
| \`shipment\`        | GLS_SHIPMENT_WITHOUT_SERVICES | **Yes**  | Shipment data (consignee, shipper, units, product) |
| \`printingOptions\` | GLS_PRINTING_OPTIONS          | **Yes**  | Label format settings                              |
| \`returnOptions\`   | GLS_RETURN_OPTIONS            | No       | Whether to return print data and routing info      |
| \`customContent\`   | GLS_CUSTOM_CONTENT            | No       | Custom logo and barcode settings                   |

---`,

                loadFunctions: (sdk) =>
                    loadFunctions(sdk, import.meta.glob("../src/functions/services/*.ts")),
            },
            {
                heading: "API functions",
                loadFunctions: (sdk) =>
                    loadFunctions(sdk, import.meta.glob("../src/functions/*.ts")),
            },
        ],
    }
}

await runStandardActionDocs(createGlsDocsConfig())
