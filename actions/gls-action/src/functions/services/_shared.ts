import { Parameter } from "@code0-tech/hercules";

export const SHARED_SERVICE_SIGNATURE =
    "shipment: GLS_SHIPMENT_WITHOUT_SERVICES, printingOptions: GLS_PRINTING_OPTIONS, returnOptions?: GLS_RETURN_OPTIONS, customContent?: GLS_CUSTOM_CONTENT";

export const SharedShipmentParameter = Parameter({
    runtimeName: "shipment",
    name: [{ code: "en-US", content: "Shipment" }],
    description: [
        {
            code: "en-US",
            content:
                "The shipment for which to create the parcels. Must include all necessary information and services for the shipment.",
        },
    ],
});

export const SharedPrintingOptionsParameter = Parameter({
    runtimeName: "printingOptions",
    name: [{ code: "en-US", content: "Printing options" }],
    description: [
        {
            code: "en-US",
            content:
                "The printing options for the shipment. Specifies options for the labels to be printed for the shipment.",
        },
    ],
});

export const SharedReturnOptionsParameter = Parameter({
    runtimeName: "returnOptions",
    name: [{ code: "en-US", content: "Return options" }],
    description: [
        {
            code: "en-US",
            content:
                "The return options for the shipment. Specifies options for return shipments.",
        },
    ],
    optional: true,
});

export const SharedCustomContentParameter = Parameter({
    runtimeName: "customContent",
    name: [{ code: "en-US", content: "Custom content" }],
    description: [
        {
            code: "en-US",
            content:
                "The custom content for the shipment. Specifies options for custom content to be printed on the labels.",
        },
    ],
    optional: true,
});
