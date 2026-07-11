//TODO: Outsource this into seperate functions for trackid, parcelnumber, references, etc.

import axios from "axios";
import {
    Description, DisplayIcon,
    DisplayMessage,
    Documentation,
    FunctionContext,
    Identifier,
    Name,
    Parameter,
    RuntimeError,
    Signature,
} from "@code0-tech/hercules";
import { getAuthToken } from "../helpers.js";
import {
    ReprintParcelResponseData,
    ReprintParcelResponseDataSchema,
} from "../data_types/glsReprintParcel.js";
import { ReturnLabels } from "../data_types/glsPrintingOptions.js";

@Identifier("reprintParcel")
@DisplayIcon("codezero:gls")
@Signature("(CreationDate: string, TemplateSet: \"NONE\"|\"D_200\"|\"PF_4_I\"|\"PF_4_I_200\"|\"PF_4_I_300\"|\"PF_8_D_200\"|\"T_200_BF\"|\"T_300_BF\"|\"ZPL_200\"|\"ZPL_200_TRACKID_EAN_128\"|\"ZPL_200_TRACKID_CODE_39\"|\"ZPL_200_REFNO_EAN_128\"|\"ZPL_200_REFNO_CODE_39\"|\"ZPL_300\"|\"ZPL_300_TRACKID_EAN_128\"|\"ZPL_300_TRACKID_CODE_39\"|\"ZPL_300_REFNO_EAN_128\"|\"ZPL_300_REFNO_CODE_39\", LabelFormat: \"PDF\"|\"ZEBRA\"|\"INTERMEC\"|\"DATAMAX\"|\"TOSHIBA\"|\"PNG\", TrackID?: string, ParcelNumber?: number, ShipmentReference?: string, ShipmentUnitReference?: string, PartnerParcelNumber?: string): GLS_REPRINT_PARCEL_RESPONSE_DATA")
@Name({ code: "en-US", content: "Reprint parcel" })
@DisplayMessage({ code: "en-US", content: "Reprint parcel" })
@Documentation({
    code: "en-US",
    content: "Reprints the label for an existing parcel.\nUse this if the original label is damaged, lost, or needs to be printed in a different format.",
})
@Description({
    code: "en-US",
    content: "Reprints the label for an existing parcel.\nUse this if the original label is damaged, lost, or needs to be printed in a different format.",
})
@Parameter({
    runtimeName: "CreationDate",
    name: [{ code: "en-US", content: "Creation date" }],
    description: [{ code: "en-US", content: "The creation date of the parcel, in ISO format (YYYY-MM-DD)." }],
})
@Parameter({
    runtimeName: "TemplateSet",
    name: [{ code: "en-US", content: "Template set" }],
    description: [{ code: "en-US", content: "The template set to use for the reprinted label." }],
})
@Parameter({
    runtimeName: "LabelFormat",
    name: [{ code: "en-US", content: "Label format" }],
    description: [{ code: "en-US", content: "The format of the reprinted label." }],
})
@Parameter({
    runtimeName: "TrackID",
    name: [{ code: "en-US", content: "Track ID" }],
    description: [{ code: "en-US", content: "The Track ID of the parcel to reprint. Max length is 8 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "ParcelNumber",
    name: [{ code: "en-US", content: "Parcel number" }],
    description: [{ code: "en-US", content: "The parcel number of the parcel to reprint." }],
    optional: true,
})
@Parameter({
    runtimeName: "ShipmentReference",
    name: [{ code: "en-US", content: "Shipment reference" }],
    description: [{ code: "en-US", content: "The shipment reference of the parcel to reprint. Max length is 40 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "ShipmentUnitReference",
    name: [{ code: "en-US", content: "Shipment unit reference" }],
    description: [{ code: "en-US", content: "The shipment unit reference of the parcel to reprint. Max length is 40 characters." }],
    optional: true,
})
@Parameter({
    runtimeName: "PartnerParcelNumber",
    name: [{ code: "en-US", content: "Partner parcel number" }],
    description: [{ code: "en-US", content: "The partner parcel number of the parcel to reprint. Max length is 50 characters." }],
    optional: true,
})
export class ReprintParcelFunction {
    async run(
        context: FunctionContext,
        CreationDate: string,
        TemplateSet: ReturnLabels["TemplateSet"],
        LabelFormat: ReturnLabels["LabelFormat"],
        TrackID?: string,
        ParcelNumber?: number,
        ShipmentReference?: string,
        ShipmentUnitReference?: string,
        PartnerParcelNumber?: string
    ): Promise<ReprintParcelResponseData> {
        const url = context.matchedConfig.findConfig("ship_it_api_url") as string;

        try {
            const result = await axios.post(
                `${url}/rs/shipments/reprintparcel`,
                {
                    TrackID,
                    ParcelNumber,
                    ShipmentReference,
                    ShipmentUnitReference,
                    PartnerParcelNumber,
                    CreationDate,
                    PrintingOptions: {
                        ReturnLabels: {
                            TemplateSet,
                            LabelFormat,
                        },
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken(context)}`,
                        "Content-Type": "application/glsVersion1+json",
                    },
                }
            );
            return ReprintParcelResponseDataSchema.parse(result.data);
        } catch (error: any) {
            console.log(error);
            throw new RuntimeError("REPRINT_PARCEL_FAILED", error.toString());
        }
    }
}
