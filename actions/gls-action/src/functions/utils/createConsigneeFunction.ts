import {
    Description,
    DisplayIcon,
    DisplayMessage,
    Documentation,
    Identifier,
    Name,
    Parameter,
    Signature,
} from "@code0-tech/hercules";
import {Address} from "../../data_types/glsAddress.js";
import {Consignee} from "../../data_types/glsConsignee.js";

@Identifier("createConsignee")
@Signature("(Address: GLS_ADDRESS, ConsigneeID?: string, CostCenter?: string, Category?: \"BUSINESS\"|\"PRIVATE\"): GLS_CONSIGNEE")
@Name({code: "en-US", content: "Create consignee for shipment"})
@DisplayIcon("tabler:truck-delivery")
@DisplayMessage({code: "en-US", content: "Create consignee for shipment"})
@Documentation({
    code: "en-US",
    content: "Creates a GLS consignee (recipient) object for use in shipments.",
})
@Description({
    code: "en-US",
    content: "Creates a GLS consignee (recipient) object for use in shipments.",
})
@Parameter({
    runtimeName: "Address",
    name: [{code: "en-US", content: "Address"}],
    description: [{code: "en-US", content: "The address of the consignee."}],
})
@Parameter({
    runtimeName: "ConsigneeID",
    name: [{code: "en-US", content: "Consignee ID"}],
    description: [{code: "en-US", content: "A customer-defined identifier for the consignee. Max 40 characters."}],
    optional: true,
})
@Parameter({
    runtimeName: "CostCenter",
    name: [{code: "en-US", content: "Cost center"}],
    description: [{code: "en-US", content: "The cost center to assign to the consignee. Max 80 characters."}],
    optional: true,
})
@Parameter({
    runtimeName: "Category",
    name: [{code: "en-US", content: "Category"}],
    description: [{code: "en-US", content: "The category of the consignee. Can be either BUSINESS or PRIVATE."}],
    optional: true,
})
export class CreateConsigneeFunction {
    run(
        _context: unknown,
        Address: Address,
        ConsigneeID?: string,
        CostCenter?: string,
        Category?: "BUSINESS" | "PRIVATE",
    ): Consignee {
        return {
            Address,
            ConsigneeID,
            CostCenter,
            Category,
        };
    }
}
