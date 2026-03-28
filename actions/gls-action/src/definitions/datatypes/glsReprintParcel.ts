import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../../helpers";
import z from "zod";

export const ReprintParcelRequestDataSchema = z.object({
    TrackID: z.string().max(8).optional(),
    ParcelNumber: z.number().max(999999999999).optional(),
    ShipmentReference: z.string().max(40).optional(),
    ShipmentUnitReference: z.string().max(40).optional(),
    PartnerParcelNumber: z.string().max(50).optional(),
    CreationDate: z.iso.date(),
    PrintingOptions: z.object({
        ReturnLabels: z.object({
            TemplateSet: z.enum(["NONE", "ZPL_200", "ZPL_300"]),
            LabelFormat: z.enum(["PDF", "ZEBRA", "PNG", "PNG_200"])
        })
    })
})
export type ReprintParcelRequestData = z.infer<typeof ReprintParcelRequestDataSchema>
export const ReprintParcelResponseDataSchema = z.object({
    CreatedShipment: z.object({
        ParcelData: z.array(z.object({
            TrackID: z.string().min(8).max(8),
            ShipmentUnitReference: z.array(z.string()).optional(),
            ParcelNumber: z.string(),
            Barcodes: z.object({
                Primary2D: z.string(),
                Secondary2D: z.string(),
                Primary1D: z.string(),
                Primary1DPrint: z.boolean(),
            }),
            RoutingInfo: z.object({
                Tour: z.string(),
                InboundSortingFlag: z.string(),
                FinalLocationCode: z.string(),
                LastRoutingDate: z.iso.date(),
                HubLocation: z.string(),
            })
        })),
        PrintData: z.array(z.object({
            Data: z.string(),
            LabelFormat: z.enum(["PDF", "ZEBRA", "PNG", "PNG_200"])
        })),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string())
    })
})
export type ReprintParcelResponseData = z.infer<typeof ReprintParcelResponseDataSchema>

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_REPRINT_PARCEL_REQUEST_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_REPRINT_PARCEL_REQUEST_DATA",
                ReprintParcelRequestDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Reprint parcel request data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Reprint parcel request data"
                }
            ]
        },
        {
            identifier: "GLS_REPRINT_PARCEL_RESPONSE_DATA",
            type: singleZodSchemaToTypescriptDef(
                "GLS_REPRINT_PARCEL_RESPONSE_DATA",
                ReprintParcelResponseDataSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Reprint parcel response data"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Reprint parcel response data"
                }
            ]
        },
    )
}
