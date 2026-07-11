import "reflect-metadata";
import {Action, CodeZeroEvent} from "@code0-tech/hercules";

import {GlsAddressDataType} from "./data_types/glsAddress.js";
import {
    GlsAllowedServicesRequestDataType,
    GlsAllowedServicesResponseDataType
} from "./data_types/glsAllowedServices.js";
import {GlsCancelShipmentRequestDataType, GlsCancelShipmentResponseDataType} from "./data_types/glsCancelShipment.js";
import {GlsConsigneeDataType} from "./data_types/glsConsignee.js";
import {GlsCreateParcelsResponseDataType} from "./data_types/glsCreateParcelsResponse.js";
import {GlsCustomContentDataType} from "./data_types/glsCustomContent.js";
import {GlsEndOfDayRequestDataType, GlsEndOfDayResponseDataType} from "./data_types/glsEndOfDay.js";
import {GlsPrintingOptionsDataType, ReturnLabelsDataType} from "./data_types/glsPrintingOptions.js";
import {GlsReprintParcelRequestDataType, GlsReprintParcelResponseDataType} from "./data_types/glsReprintParcel.js";
import {GlsReturnOptionsDataType} from "./data_types/glsReturnOptions.js";
import {GlsShipmentDataType, GlsShipmentWithoutServicesDataType} from "./data_types/glsShipment.js";
import {GlsShipmentUnitDataType} from "./data_types/glsShipmentUnit.js";
import {GlsShipperDataType} from "./data_types/glsShipper.js";
import {GlsUnitServiceDataType} from "./data_types/glsUnitService.js";
import {
    GlsUpdateParcelWeightRequestDataType,
    GlsUpdateParcelWeightResponseDataType
} from "./data_types/glsUpdateParcelWeight.js";
import {
    GlsValidateShipmentRequestDataType,
    GlsValidateShipmentResponseDataType
} from "./data_types/glsValidateShipment.js";

import {CancelShipmentFunction} from "./functions/cancelShipmentFunction.js";
import {GetAllowedServicesFunction} from "./functions/getAllowedServicesFunction.js";
import {GetEndOfDayReportFunction} from "./functions/getEndOfDayReportFunction.js";
import {ReprintParcelFunction} from "./functions/reprintParcelFunction.js";
import {UpdateParcelWeightFunction} from "./functions/updateParcelWeightFunction.js";
import {ValidateShipmentFunction} from "./functions/validateShipmentFunction.js";
import {CreateFlexDeliveryShipmentFunction} from "./functions/services/createFlexDeliveryShipmentFunction.js";

import {CreateAddressFunction} from "./functions/utils/createAddressFunction.js";
import {CreateConsigneeFunction} from "./functions/utils/createConsigneeFunction.js";
import {CreateCustomContentFunction} from "./functions/utils/createCustomContentFunction.js";
import {CreatePrintingOptionsFunction} from "./functions/utils/createPrintingOptionsFunction.js";
import {CreateShipmentFunction} from "./functions/utils/createShipmentFunction.js";
import {CreateShipmentUnitFunction} from "./functions/utils/createShipmentUnitFunction.js";
import {CreateShipperFunction} from "./functions/utils/createShipperFunction.js";

const action = new Action(
    process.env.ACTION_ID ?? "gls-action",
    process.env.VERSION ?? "1.0.0",
    process.env.AQUILA_URL ?? "127.0.0.1:8081",
    "code0-tech",
    "codezero:gls",
    "GLS shipping integration: create, validate, cancel, reprint, and report shipments via the GLS ShipIt API.",
    [{code: "en-US", content: "GLS Action"}],
    [
        {
            identifier: "auth_url",
            type: "TEXT",
            defaultValue: "https://api.gls-group.net/oauth2/v2/token",
            name: [{code: "en-US", content: "The Auth API url"}],
            description: [{code: "en-US", content: "The url of the Auth api ending in /token."}],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "client_id",
            type: "TEXT",
            name: [{code: "en-US", content: "Client ID"}],
            description: [{code: "en-US", content: "The client id to authenticate with the GLS API."}],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "client_secret",
            type: "TEXT",
            name: [{code: "en-US", content: "Client secret"}],
            description: [{code: "en-US", content: "The client secret to authenticate with the GLS API."}],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "contact_id",
            type: "TEXT",
            defaultValue: "",
            name: [{code: "en-US", content: "Contact ID"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "The contact id identifying the GLS account to use for the API requests. This contact must be linked to a GLS contract with API access.",
                },
            ],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "ship_it_api_url",
            type: "TEXT",
            defaultValue: "https://api.gls-group.net/shipit-farm/v1/backend/rs",
            name: [{code: "en-US", content: "The ShipIt API url"}],
            description: [{code: "en-US", content: "The url of the GLS ShipIt API."}],
            linkedDataTypes: ["TEXT"],
        },
        {
            identifier: "default_shipper",
            type: "GLS_SHIPPER",
            name: [{code: "en-US", content: "Shipper"}],
            description: [
                {
                    code: "en-US",
                    content:
                        "The shipper information to use for the shipments. This will be used if the shipper information is not provided in the shipment data.",
                },
            ],
            linkedDataTypes: ["GLS_SHIPPER"],
        },
    ]
);

action.registerDataTypeClass(GlsAddressDataType);
action.registerDataTypeClass(GlsAllowedServicesRequestDataType);
action.registerDataTypeClass(GlsAllowedServicesResponseDataType);
action.registerDataTypeClass(GlsCancelShipmentRequestDataType);
action.registerDataTypeClass(GlsCancelShipmentResponseDataType);
action.registerDataTypeClass(GlsConsigneeDataType);
action.registerDataTypeClass(GlsCreateParcelsResponseDataType);
action.registerDataTypeClass(GlsCustomContentDataType);
action.registerDataTypeClass(GlsEndOfDayRequestDataType);
action.registerDataTypeClass(GlsEndOfDayResponseDataType);
action.registerDataTypeClass(GlsPrintingOptionsDataType);
action.registerDataTypeClass(ReturnLabelsDataType);
action.registerDataTypeClass(GlsReprintParcelRequestDataType);
action.registerDataTypeClass(GlsReprintParcelResponseDataType);
action.registerDataTypeClass(GlsReturnOptionsDataType);
action.registerDataTypeClass(GlsShipmentDataType);
action.registerDataTypeClass(GlsShipmentWithoutServicesDataType);
action.registerDataTypeClass(GlsShipmentUnitDataType);
action.registerDataTypeClass(GlsShipperDataType);
action.registerDataTypeClass(GlsUnitServiceDataType);
action.registerDataTypeClass(GlsUpdateParcelWeightRequestDataType);
action.registerDataTypeClass(GlsUpdateParcelWeightResponseDataType);
action.registerDataTypeClass(GlsValidateShipmentRequestDataType);
action.registerDataTypeClass(GlsValidateShipmentResponseDataType);

action.registerRuntimeFunction(CancelShipmentFunction);
action.registerRuntimeFunction(GetAllowedServicesFunction);
action.registerRuntimeFunction(GetEndOfDayReportFunction);
action.registerRuntimeFunction(ReprintParcelFunction);
action.registerRuntimeFunction(UpdateParcelWeightFunction);
action.registerRuntimeFunction(ValidateShipmentFunction);

/*action.registerRuntimeFunction(CreateAddresseeOnlyShipmentFunction);
action.registerRuntimeFunction(CreateDeliveryAtWorkShipmentFunction);
action.registerRuntimeFunction(CreateDeliveryNextWorkingDayShipmentFunction);
action.registerRuntimeFunction(CreateDeliverySaturdayShipmentFunction);
action.registerRuntimeFunction(CreateDepositShipmentFunction);
action.registerRuntimeFunction(CreateExchangeShipmentFunction);*/
action.registerRuntimeFunction(CreateFlexDeliveryShipmentFunction);
/*action.registerRuntimeFunction(CreateGuaranteed24ShipmentFunction);
action.registerRuntimeFunction(CreateIdentPinShipmentFunction);
action.registerRuntimeFunction(CreateIdentShipmentFunction);
action.registerRuntimeFunction(CreatePickAndShipShipmentFunction);
action.registerRuntimeFunction(CreateShopDeliveryShipmentFunction);
action.registerRuntimeFunction(CreateShopReturnShipmentFunction);
action.registerRuntimeFunction(CreateSignatureShipmentFunction);
action.registerRuntimeFunction(CreateTyreShipmentFunction);*/

action.registerRuntimeFunction(CreateAddressFunction);
action.registerRuntimeFunction(CreateConsigneeFunction);
action.registerRuntimeFunction(CreateCustomContentFunction);
action.registerRuntimeFunction(CreatePrintingOptionsFunction);
action.registerRuntimeFunction(CreateShipmentFunction);
action.registerRuntimeFunction(CreateShipmentUnitFunction);
action.registerRuntimeFunction(CreateShipperFunction);

action.on(CodeZeroEvent.connected, () => {
    console.log("Connected to aquila");
});

action.on(CodeZeroEvent.error, (error: Error) => {
    console.error("Stream error:", error.message);
    console.log("Attempting to reconnect in 5s...");
    setTimeout(() => {
        action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
            action.emit(CodeZeroEvent.error, err);
        })
    }, 5000);
});

action.connect(process.env.AUTH_TOKEN ?? "your_auth_token_here").catch((err: Error) => {
    action.emit(CodeZeroEvent.error, err);
});

action.on(CodeZeroEvent.moduleUpdated, (message: any) => {
    console.dir(message, {depth: null});
    console.dir(action.configs.values(), {depth: null})
})

export {action};
