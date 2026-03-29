import {ActionSdk} from "@code0-tech/hercules";
import {singleZodSchemaToTypescriptDef} from "../helpers";
import {z} from "zod";

export const CreateParcelsResponseSchema = z.object({
    CreatedShipment: z.object({
        ShipmentReference: z.array(z.string()),
        ParcelData: z.array(z.object({
            TrackID: z.string().min(8).max(8),
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
            LabelFormat: z.enum(["PDF", "ZEBRA", "INTERMEC", "DATAMAX", "TOSHIBA", "PNG"])
        })),
        CustomerID: z.string(),
        PickupLocation: z.string(),
        GDPR: z.array(z.string())
    }),
})
export type CreateParcelsResponse = z.infer<typeof CreateParcelsResponseSchema>

export default (sdk: ActionSdk) => {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_CREATE_PARCELS_RESPONSE",
            type: singleZodSchemaToTypescriptDef(
                "GLS_CREATE_PARCELS_RESPONSE",
                CreateParcelsResponseSchema
            ),
            name: [
                {
                    code: "en-US",
                    content: "Create parcels response"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Create parcels response"
                }
            ]
        },
    )
}
