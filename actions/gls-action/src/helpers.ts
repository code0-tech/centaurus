import {ZodError} from "zod";
import axios from "axios";
import {
    HerculesRuntimeFunctionDefinition,
    HerculesFunctionContext,
    RuntimeErrorException,
    ActionSdk
} from "@code0-tech/hercules";
import {InternalShipmentServiceSchema, ShipmentService} from "./types/glsShipmentService";
import {ShipmentWithoutServices} from "./types/glsShipment";
import {
    CancelShipmentRequestData,
    CancelShipmentResponseData,
    CancelShipmentResponseDataSchema
} from "./types/glsCancelShipment";
import {
    InternalValidateShipmentRequestData,
    ValidateShipmentRequestData
} from "./types/glsValidateShipment";
import {InternalShipmentUnitSchema} from "./types/glsShipmentUnit";
import {InternalShipper, ShipperSchema} from "./types/glsShipper";
import {CreateParcelsResponse, CreateParcelsResponseSchema} from "./types/glsCreateParcelsResponse";
import {PrintingOptions} from "./types/glsPrintingOptions";
import {CustomContent} from "./types/glsCustomContent";
import {ReturnOptions} from "./types/glsReturnOptions";
import {
    AuthenticationRequestData,
    AuthenticationRequestDataSchema,
    AuthenticationResponseDataSchema
} from "./types/auth";
import {
    InternalShipmentRequestData,
    ShipmentRequestData,
    ShipmentRequestDataSchema
} from "./types/shipmentRequest";


export const DEFAULT_SIGNATURE_FOR_SERVICES = "shipment: GLS_SHIPMENT, printingOptions: GLS_PRINTING_OPTIONS, returnOptions?: GLS_RETURN_OPTIONS, customContent?: GLS_CUSTOM_CONTENT"
export const DEFAULT_PARAMETERS_FOR_SERVICES: HerculesRuntimeFunctionDefinition["parameters"] = [
    {
        runtimeName: "shipment",
        name: [
            {
                code: "en-US",
                content: "Shipment",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The shipment for which to create the parcels. Must include all necessary information and services for the shipment.",
            }
        ]
    },
    {
        runtimeName: "printingOptions",
        name: [
            {
                code: "en-US",
                content: "Printing options",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The printing options for the shipment. Specifies options for the labels to be printed for the shipment.",
            }
        ]
    },
    {
        runtimeName: "returnOptions",
        name: [
            {
                code: "en-US",
                content: "Return options",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The return options for the shipment. Specifies options for return shipments.",
            }
        ]
    },
    {
        runtimeName: "customContent",
        name: [
            {
                code: "en-US",
                content: "Custom content",
            }
        ],
        description: [
            {
                code: "en-US",
                content: "The custom content for the shipment. Specifies options for custom content to be printed on the labels.",
            }
        ]
    }
] as HerculesRuntimeFunctionDefinition["parameters"]
export const DEFAULT_DATA_TYPES_FOR_SERVICES = [
    "GLS_SHIPMENT",
    "GLS_PRINTING_OPTIONS",
    "GLS_RETURN_OPTIONS",
    "GLS_CUSTOM_CONTENT",
    "GLS_CREATE_PARCELS_RESPONSE"
]



let cachedToken = {
    token: "",
    tokenType: "",
    expiresAt: 0,
}

export const getAuthToken = async (context: HerculesFunctionContext) => {
    const data: AuthenticationRequestData = {
        client_id: context.matchedConfig.findConfig("client_id") as string,
        client_secret: context.matchedConfig.findConfig("client_secret") as string,
        grant_type: "client_credentials"
    }
    const url = context.matchedConfig.findConfig("auth_url") as string

    if (cachedToken.expiresAt > Date.now()) {
        console.log("Using cached access token")
        return cachedToken.token
    }


    const authValue = await axios.post(url, AuthenticationRequestDataSchema.parse(data), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })
    const result = AuthenticationResponseDataSchema.parse(authValue.data)
    console.log("Authentication successful, access token:", result.token_type, result.access_token.substring(0, 10) + "...")
    cachedToken = {
        token: result.access_token,
        tokenType: result.token_type,
        expiresAt: Date.now() + (result.expires_in - 60) * 1000
    }
    return result.access_token
}

export const cancelShipment = async (data: CancelShipmentRequestData, context: HerculesFunctionContext): Promise<CancelShipmentResponseData> => {
    const url = context.matchedConfig.findConfig("ship_it_api_url") as string;


    try {
        const result = await axios.post(`${url}/rs/shipments/cancel/${data.TrackID}`, {}, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return CancelShipmentResponseDataSchema.parse(result.data)
    } catch (error: any) {
        if (error.response?.headers?.args) {
            const headers = error.response.headers;
            console.error("Error sending cancel shipment request to GLS API:", headers.error, headers.args)
            throw new RuntimeErrorException("ERROR_CANCELING_GLS_SHIPMENT", `GLS API error: ${headers.error}, args: ${headers.args}`)
        }
        throw new RuntimeErrorException("ERROR_CANCELING_GLS_SHIPMENT")
    }
}


export function transformValidateShipmentRequestDataToInternalFormat(data: ValidateShipmentRequestData, context: HerculesFunctionContext | undefined, contactID: string): InternalValidateShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(context, contactID, data.Shipment.Shipper),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit)
        }
    }
}


export function getShipper(context: HerculesFunctionContext | undefined, contactID: string | undefined, shipper?: ShipperSchema): InternalShipper {
    const configShipper = context?.matchedConfig.findConfig("default_shipper") as ShipperSchema || undefined

    if (!shipper && !configShipper) {
        throw new RuntimeErrorException("MISSING_SHIPPER_INFORMATION", "No shipper information provided in shipment data or configuration.")
    }

    if (shipper) {
        return {
            ...shipper,
            ContactID: contactID
        }
    }

    return {
        ...configShipper,
        ContactID: contactID
    }
}


export function transformShipmentRequestDataToInternalFormat(data: ShipmentRequestData, context: HerculesFunctionContext | undefined, contactID: string | undefined): InternalShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(context, contactID, data.Shipment.Shipper),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit)
        }
    }
}

const postShipments = async (data: ShipmentRequestData, context: HerculesFunctionContext): Promise<CreateParcelsResponse> => {
    const contactID = context.matchedConfig.findConfig("contact_id") as string;
    const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

    const parsedData: InternalShipmentRequestData = transformShipmentRequestDataToInternalFormat(ShipmentRequestDataSchema.parse(data), context, contactID);


    try {
        const result = await axios.post(`${url}/rs/shipments`, parsedData, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })

        return CreateParcelsResponseSchema.parse(result.data) as CreateParcelsResponse
    } catch (error: any) {
        if (error.response?.data) {
            console.error("Error response from GLS API:", error.response.data)
        } else if (error.response?.headers) {
            const headers = error?.response.headers;
            console.error("Error sending request to GLS API:", headers.error, headers.args)
        } else if (error instanceof ZodError) {
            console.error("Error sending request to GLS API:", error.message)
        } else {
            console.error("Error sending request to GLS API:", error)
        }
        return Promise.reject(error)
    }
}

export async function postShipmentHelper(context: HerculesFunctionContext, services: ShipmentService, shipment: ShipmentWithoutServices, printingOptions: PrintingOptions, customContent?: CustomContent, returnOptions?: ReturnOptions): Promise<CreateParcelsResponse> {
    try {
        return await postShipments({
            PrintingOptions: printingOptions,
            CustomContent: customContent,
            ReturnOptions: returnOptions,
            Shipment: {
                ...shipment,
                Service: services
            },
        }, context)
    } catch (error) {
        if (typeof error === "string") {
            throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", error)
        }
        throw new RuntimeErrorException("ERROR_CREATING_GLS_SHIPMENT", "An error occurred while creating the shipment.")
    }
}

export async function loadAllDefinitions(sdk: ActionSdk) {
    const modules = import.meta.glob('./{types,functions,config}/**/*.ts');

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