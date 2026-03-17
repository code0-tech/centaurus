import {ZodError, ZodObject} from "zod";
import {createAuxiliaryTypeStore, printNode, zodToTs} from "zod-to-ts";
import ts from "typescript";
import {
    AllowedServicesRequestData, AllowedServicesResponseData, AllowedServicesResponseDataSchema,
    AuthenticationRequestData, AuthenticationRequestDataSchema, AuthenticationResponseDataSchema,
    CancelShipmentRequestData, CancelShipmentResponseData,
    CancelShipmentResponseDataSchema, CreateParcelsResponse,
    CreateParcelsResponseSchema, CustomContent, EndOfDayRequestData, EndOfDayResponseData,
    EndOfDayResponseDataSchema, InternalShipmentRequestData,
    InternalShipmentServiceSchema, InternalShipmentUnitSchema, InternalShipper, InternalValidateShipmentRequestData,
    PrintingOptions,
    ReprintParcelRequestData, ReprintParcelResponseData,
    ReprintParcelResponseDataSchema, ReturnOptions, ShipmentRequestData, ShipmentRequestDataSchema, ShipmentService,
    ShipmentWithoutServices, Shipper,
    UpdateParcelWeightRequestData,
    UpdateParcelWeightResponseData,
    UpdateParcelWeightResponseDataSchema, ValidateShipmentRequestData, ValidateShipmentResponseData,
    ValidateShipmentResponseDataSchema
} from "./types";
import axios from "axios";
import {HerculesFunctionContext, RuntimeErrorException} from "@code0-tech/hercules";

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
    if (cachedToken.expiresAt > Date.now()) {
        console.log("Using cached access token")
        return cachedToken.token
    }


    const authValue = await axios.post("https://api-sandbox.gls-group.net/oauth2/v2/token", AuthenticationRequestDataSchema.parse(data), {
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

export const validateShipment = async (data: ValidateShipmentRequestData, context: HerculesFunctionContext): Promise<ValidateShipmentResponseData> => {
    const url = context?.matchedConfig.findConfig("api_url") as string;
    const contactID = context?.matchedConfig.findConfig("contact_id") as string || ""

    try {
        const result = await axios.post(`${url}/rs/shipments/validate`, transformValidateShipmentRequestDataToInternalFormat(data, context, contactID), {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return ValidateShipmentResponseDataSchema.parse(result.data)
    } catch (error: any) {
        throw error
    }

}
export const reprintParcel = async (data: ReprintParcelRequestData, context: HerculesFunctionContext): Promise<ReprintParcelResponseData> => {
    const url = context.matchedConfig.findConfig("api_url") as string;

    try {
        const result = await axios.post(`${url}/rs/shipments/reprintparcel`, data, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return ReprintParcelResponseDataSchema.parse(result.data)
    } catch (error: any) {
        console.error("Error response from GLS API:", error)
        throw error
    }
}

export const updateParcelWeight = async (data: UpdateParcelWeightRequestData, context: HerculesFunctionContext): Promise<UpdateParcelWeightResponseData> => {
    const url = context.matchedConfig.findConfig("api_url") as string;

    try {
        const result = await axios.post(`${url}/rs/shipments/updateparcelweight`, data, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return UpdateParcelWeightResponseDataSchema.parse(result.data)
    } catch (error: any) {
        console.log(error)
        throw error
    }

}

export const getEndOfDayInfo = async (data: EndOfDayRequestData, context: HerculesFunctionContext): Promise<EndOfDayResponseData> => {
    const url = context.matchedConfig.findConfig("api_url") as string;

    try {
        const result = await axios.post(`${url}/rs/shipments/endofday?date=${data.date}`, {}, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return EndOfDayResponseDataSchema.parse(result.data)
    } catch (error: any) {
        console.error("Error response from GLS API:", error)
        throw error
    }
}

export const getAllowedServices = async (data: AllowedServicesRequestData, context: HerculesFunctionContext): Promise<AllowedServicesResponseData> => {
    const url = context.matchedConfig.findConfig("api_url") as string;

    try {
        const result = await axios.post(`${url}/rs/shipments/allowedservices`, data, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json"
            }
        })
        return AllowedServicesResponseDataSchema.parse(result.data)
    } catch (error: any) {
        if (error.response?.data) {
            console.error("Error response from GLS API:", error.response.data)
        } else if (error.response?.headers) {
            const headers = error?.response.headers;
            console.error("Error sending request to GLS API:", headers.error, headers.args)
            throw new RuntimeErrorException("ERROR_FETCHING_ALLOWED_SERVICES", `GLS API error: ${headers.error}, args: ${headers.args}`)
        } else if (error instanceof ZodError) {
            console.error("Error sending request to GLS API:", error.message)
        } else {
            console.error("Error sending request to GLS API:", error)
        }
        throw error
    }

}

export const cancelShipment = async (data: CancelShipmentRequestData, context: HerculesFunctionContext): Promise<CancelShipmentResponseData> => {
    const url = context.matchedConfig.findConfig("api_url") as string;


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
        console.error("Error sending cancel shipment request to GLS API:", error)
        throw error
    }
}

const postShipments = async (data: ShipmentRequestData, context: HerculesFunctionContext): Promise<CreateParcelsResponse> => {
    const contactID = context.matchedConfig.findConfig("contact_id") as string;
    const url = context.matchedConfig.findConfig("api_url") as string;

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

export function transformValidateShipmentRequestDataToInternalFormat(data: ValidateShipmentRequestData, context: HerculesFunctionContext | undefined, contactID: string): InternalValidateShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(data.Shipment.Shipper, context, contactID),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit)
        }
    }
}

function transformShipmentRequestDataToInternalFormat(data: ShipmentRequestData, context: HerculesFunctionContext | undefined, contactID: string | undefined): InternalShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(data.Shipment.Shipper, context, contactID),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit)
        }
    }
}

function getShipper(shipper: Shipper, context: HerculesFunctionContext | undefined, contactID: string | undefined): InternalShipper {
    const configShipper = context?.matchedConfig.findConfig("shipper") as Shipper || undefined

    if (configShipper) {
        return {
            ...configShipper,
            ContactID: contactID
        }
    } else {
        return {
            ...shipper,
            ContactID: contactID
        }
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
