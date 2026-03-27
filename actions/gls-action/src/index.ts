import {createSdk} from "@code0-tech/hercules"
import {
    loadAllDefinitions, zodSchemaToTypescriptDefs
} from "./helpers";
import {
    AddressSchema,
    AllowedServicesRequestDataSchema,
    AllowedServicesResponseDataSchema,
    CancelShipmentRequestDataSchema,
    CancelShipmentResponseDataSchema,
    ConsigneeSchema,
    CreateParcelsResponseSchema,
    CustomContentSchema,
    EndOfDayRequestDataSchema,
    PrintingOptionsSchema,
    ReprintParcelRequestDataSchema,
    ReprintParcelResponseDataSchema,
    ReturnOptionsSchema,
    ShipmentRequestDataSchema,
    ShipmentSchema,
    ShipmentServiceSchema,
    ShipmentUnitSchema,
    ShipmentWithoutServicesSchema,
    ShipperSchema,
    UnitServiceSchema,
    UpdateParcelWeightRequestDataSchema,
    UpdateParcelWeightResponseDataSchema,
    ValidateShipmentRequestDataSchema,
    ValidateShipmentResponseDataSchema
} from "./types";

export const sdk = createSdk({
    authToken: process.env.HERCULES_AUTH_TOKEN || "",
    aquilaUrl: process.env.HERCULES_AQUILA_URL || "127.0.0.1:50051",
    actionId: process.env.HERCULES_ACTION_ID || "gls-action",
    version: process.env.HERCULES_SDK_VERSION || "0.0.0",
})

export const types: Map<string, string> = new Map([
    ...zodSchemaToTypescriptDefs(
        "GLS_SHIPMENT_WITHOUT_SERVICES",
        ShipmentWithoutServicesSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_SHIPMENT_REQUEST_DATA",
        ShipmentRequestDataSchema,
        {
            GLS_ADDRESS: AddressSchema,
            GLS_CONSIGNEE: ConsigneeSchema,
            GLS_UNIT_SERVICE: UnitServiceSchema,
            GLS_SHIPMENT_UNIT: ShipmentUnitSchema,
            GLS_SHIPPER: ShipperSchema,
            GLS_SHIPMENT_SERVICE: ShipmentServiceSchema,
            GLS_SHIPMENT: ShipmentSchema,
            GLS_PRINTING_OPTIONS: PrintingOptionsSchema,
            GLS_RETURN_OPTIONS: ReturnOptionsSchema,
            GLS_CUSTOM_CONTENT: CustomContentSchema,
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CREATE_PARCELS_RESPONSE",
        CreateParcelsResponseSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CANCEL_SHIPMENT_REQUEST_DATA",
        CancelShipmentRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_CANCEL_SHIPMENT_RESPONSE_DATA",
        CancelShipmentResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_ALLOWED_SERVICES_REQUEST_DATA",
        AllowedServicesRequestDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_ALLOWED_SERVICES_RESPONSE_DATA",
        AllowedServicesResponseDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_END_OF_DAY_REQUEST_DATA",
        EndOfDayRequestDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_END_OF_DAY_RESPONSE_DATA",
        EndOfDayRequestDataSchema,
        {
            GLS_ADDRESS: AddressSchema
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA",
        UpdateParcelWeightRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA",
        UpdateParcelWeightResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_REPRINT_PARCEL_REQUEST_DATA",
        ReprintParcelRequestDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_REPRINT_PARCEL_RESPONSE_DATA",
        ReprintParcelResponseDataSchema,
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_VALIDATE_SHIPMENT_REQUEST_DATA",
        ValidateShipmentRequestDataSchema,
        {
            GLS_SHIPMENT: ShipmentSchema
        }
    ),
    ...zodSchemaToTypescriptDefs(
        "GLS_VALIDATE_SHIPMENT_RESPONSE_DATA",
        ValidateShipmentResponseDataSchema
    ),
    ...zodSchemaToTypescriptDefs(
        "RETURN_LABELS",
        PrintingOptionsSchema,
    )
])

loadAllDefinitions().then((_) => {
    connectToSdk();
}).catch(reason => {
    console.error(reason)
})

function connectToSdk() {
    sdk.connect().then(() => {
        console.log("SDK connected successfully");
    }).catch(() => {
        console.error("Error connecting SDK:");
    })

    sdk.onError((error) => {
        console.error("SDK Error occurred:", error.message);
        console.log("Attempting to reconnect in 5s...");
        setTimeout(() => {
            connectToSdk();
        }, 5000)
    })
}
