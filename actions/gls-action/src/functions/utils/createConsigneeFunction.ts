import {
    Description,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import { Address } from "../../data_types/glsAddress.js";
import { Consignee } from "../../data_types/glsConsignee.js";

@Identifier("createConsignee")
@Signature("(consigneeId: string, costCenter: string, Address: GLS_ADDRESS, Category: \"BUSINESS\"|\"PRIVATE\"): GLS_CONSIGNEE")
@Name({ code: "en-US", content: "Create consignee" })
@DisplayMessage({ code: "en-US", content: "Create consignee" })
@Documentation({
    code: "en-US",
    content: "Creates a GLS consignee (recipient) object for use in shipments.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS consignee (recipient) object for use in shipments.",
})
@Parameter({
    runtimeName: "consigneeId",
    name: [{ code: "en-US", content: "Consignee ID" }],
    description: [{ code: "en-US", content: "The ID of the consignee. Max length is 40 characters." }],
})
@Parameter({
    runtimeName: "costCenter",
    name: [{ code: "en-US", content: "Cost center" }],
    description: [{ code: "en-US", content: "The cost center for the consignee. Max length is 80 characters." }],
})
@Parameter({
    runtimeName: "Address",
    name: [{ code: "en-US", content: "Address" }],
    description: [{ code: "en-US", content: "The address of the consignee." }],
})
@Parameter({
    runtimeName: "Category",
    name: [{ code: "en-US", content: "Category" }],
    description: [{ code: "en-US", content: "The category of the consignee. Can be either BUSINESS or PRIVATE." }],
})
export class CreateConsigneeFunction {
    run(
        _context: unknown,
        consigneeId: string,
        costCenter: string,
        Address: Address,
        Category: "BUSINESS" | "PRIVATE"
    ): Consignee {
        return {
            Address,
            Category,
            ConsigneeID: consigneeId,
            CostCenter: costCenter,
        };
    }
}
