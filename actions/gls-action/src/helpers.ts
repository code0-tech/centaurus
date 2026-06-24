import { FunctionContext, RuntimeError } from "@code0-tech/hercules";
import axios from "axios";
import { ZodError, z } from "zod";
import { InternalShipmentServiceSchema, ShipmentService } from "./data_types/glsShipmentService.js";
import { ShipmentWithoutServices } from "./data_types/glsShipment.js";
import {
    CancelShipmentRequestData,
    CancelShipmentResponseData,
    CancelShipmentResponseDataSchema,
} from "./data_types/glsCancelShipment.js";
import {
    InternalValidateShipmentRequestData,
    ValidateShipmentRequestData,
} from "./data_types/glsValidateShipment.js";
import { InternalShipmentUnitSchema } from "./data_types/glsShipmentUnit.js";
import { InternalShipper, ShipperSchemaType } from "./data_types/glsShipper.js";
import {
    CreateParcelsResponse,
    CreateParcelsResponseSchema,
} from "./data_types/glsCreateParcelsResponse.js";
import { PrintingOptions } from "./data_types/glsPrintingOptions.js";
import { CustomContent } from "./data_types/glsCustomContent.js";
import { ReturnOptions } from "./data_types/glsReturnOptions.js";
import {
    InternalShipmentRequestData,
    ShipmentRequestData,
    ShipmentRequestDataSchema,
} from "./data_types/shipmentRequest.js";

export const AuthenticationRequestDataSchema = z.object({
    grant_type: z.string().default("client_credentials"),
    client_id: z.string(),
    client_secret: z.string(),
    scope: z.string().optional(),
});
export type AuthenticationRequestData = z.infer<typeof AuthenticationRequestDataSchema>;

export const AuthenticationResponseDataSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
});
export type AuthenticationResponseData = z.infer<typeof AuthenticationResponseDataSchema>;

let cachedToken = {
    token: "",
    tokenType: "",
    expiresAt: 0,
};

export const getAuthToken = async (context: FunctionContext): Promise<string> => {
    const data: AuthenticationRequestData = {
        client_id: context.matchedConfig.findConfig("client_id") as string,
        client_secret: context.matchedConfig.findConfig("client_secret") as string,
        grant_type: "client_credentials",
    };
    const url = context.matchedConfig.findConfig("auth_url") as string;

    if (cachedToken.expiresAt > Date.now()) {
        console.log("Using cached access token");
        return cachedToken.token;
    }

    const authValue = await axios.post(url, AuthenticationRequestDataSchema.parse(data), {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    const result = AuthenticationResponseDataSchema.parse(authValue.data);
    console.log(
        "Authentication successful, access token:",
        result.token_type,
        result.access_token.substring(0, 10) + "..."
    );
    cachedToken = {
        token: result.access_token,
        tokenType: result.token_type,
        expiresAt: Date.now() + (result.expires_in - 60) * 1000,
    };
    return result.access_token;
};

export const cancelShipment = async (
    data: CancelShipmentRequestData,
    context: FunctionContext
): Promise<CancelShipmentResponseData> => {
    const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

    try {
        const result = await axios.post(
            `${url}/rs/shipments/cancel/${data.TrackID}`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${await getAuthToken(context)}`,
                    "Content-Type": "application/glsVersion1+json",
                },
            }
        );
        return CancelShipmentResponseDataSchema.parse(result.data);
    } catch (error: any) {
        if (error.response?.headers?.args) {
            const headers = error.response.headers;
            console.error("Error sending cancel shipment request to GLS API:", headers.error, headers.args);
            throw new RuntimeError(
                "ERROR_CANCELING_GLS_SHIPMENT",
                `GLS API error: ${headers.error}, args: ${headers.args}`
            );
        }
        throw new RuntimeError("ERROR_CANCELING_GLS_SHIPMENT");
    }
};

export function getShipper(
    context: FunctionContext | undefined,
    contactID: string | undefined,
    shipper?: ShipperSchemaType
): InternalShipper {
    const configShipper =
        (context?.matchedConfig.findConfig("default_shipper") as ShipperSchemaType) || undefined;

    if (!shipper && !configShipper) {
        throw new RuntimeError(
            "MISSING_SHIPPER_INFORMATION",
            "No shipper information provided in shipment data or configuration."
        );
    }

    if (shipper) {
        return {
            ...shipper,
            ContactID: contactID,
        };
    }

    return {
        ...configShipper,
        ContactID: contactID,
    };
}

export function transformValidateShipmentRequestDataToInternalFormat(
    data: ValidateShipmentRequestData,
    context: FunctionContext | undefined,
    contactID: string
): InternalValidateShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(context, contactID, data.Shipment.Shipper),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit),
        },
    };
}

export function transformShipmentRequestDataToInternalFormat(
    data: ShipmentRequestData,
    context: FunctionContext | undefined,
    contactID: string | undefined
): InternalShipmentRequestData {
    return {
        ...data,
        Shipment: {
            ...data.Shipment,
            Middleware: "CodeZeroviaGLS",
            Shipper: getShipper(context, contactID, data.Shipment.Shipper),
            Service: InternalShipmentServiceSchema.parse(data.Shipment.Service),
            ShipmentUnit: InternalShipmentUnitSchema.parse(data.Shipment.ShipmentUnit),
        },
    };
}

const postShipments = async (
    data: ShipmentRequestData,
    context: FunctionContext
): Promise<CreateParcelsResponse> => {
    const contactID = context.matchedConfig.findConfig("contact_id") as string;
    const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

    const parsedData: InternalShipmentRequestData = transformShipmentRequestDataToInternalFormat(
        ShipmentRequestDataSchema.parse(data),
        context,
        contactID
    );

    try {
        const result = await axios.post(`${url}/rs/shipments`, parsedData, {
            headers: {
                Authorization: `Bearer ${await getAuthToken(context)}`,
                "Content-Type": "application/glsVersion1+json",
            },
        });

        return CreateParcelsResponseSchema.parse(result.data) as CreateParcelsResponse;
    } catch (error: any) {
        if (error.response?.data) {
            console.error("Error response from GLS API:", error.response.data);
        } else if (error.response?.headers) {
            const headers = error.response.headers;
            console.error("Error sending request to GLS API:", headers.error, headers.args);
        } else if (error instanceof ZodError) {
            console.error("Error sending request to GLS API:", error.message);
        } else {
            console.error("Error sending request to GLS API:", error);
        }
        return Promise.reject(error);
    }
};

export async function postShipmentHelper(
    context: FunctionContext,
    services: ShipmentService,
    shipment: ShipmentWithoutServices,
    printingOptions: PrintingOptions,
    customContent?: CustomContent,
    returnOptions?: ReturnOptions
): Promise<CreateParcelsResponse> {
    try {
        return await postShipments(
            {
                PrintingOptions: printingOptions,
                CustomContent: customContent,
                ReturnOptions: returnOptions,
                Shipment: {
                    ...shipment,
                    Service: services,
                },
            },
            context
        );
    } catch (error) {
        if (typeof error === "string") {
            throw new RuntimeError("ERROR_CREATING_GLS_SHIPMENT", error);
        }
        throw new RuntimeError(
            "ERROR_CREATING_GLS_SHIPMENT",
            "An error occurred while creating the shipment."
        );
    }
}
