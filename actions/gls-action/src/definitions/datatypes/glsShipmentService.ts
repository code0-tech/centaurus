import z from "zod";
import {AddressSchema} from "./glsAddress";
import {zodSchemaToTypescriptDefs} from "../../helpers";
import {ShipmentSchema} from "./glsShipment";
import {ActionSdk} from "@code0-tech/hercules";


export const ShipmentServiceSchema = z.array(z.object({
    Service: z.object({
        serviceName: z.string()
    }).optional(),
    ShopDelivery: z.object({
        ParcelShopID: z.string().max(50)
    }).optional(),
    ShopReturn: z.object({
        NumberOfLabels: z.number(),
        ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional()
    }).optional(),
    Intercompany: z.object({
        Address: AddressSchema,
        NumberOfLabels: z.number().min(1),
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    Exchange: z.object({
        Address: AddressSchema,
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    DeliveryAtWork: z.object({
        RecipientName: z.string().max(40),
        AlternateRecipientName: z.string().max(40).optional(),
        Building: z.string().max(40),
        Floor: z.number(),
        Room: z.number().optional(),
        Phonenumber: z.string().max(35).optional()
    }).optional(),
    Deposit: z.object({
        PlaceOfDeposit: z.string().max(121),
    }).optional(),
    IdentPin: z.object({
        PIN: z.string().max(4),
        Birthdate: z.iso.date().optional()
    }).optional(),
    Ident: z.object({
        Birthdate: z.iso.date(),
        Firstname: z.string().max(40),
        Lastname: z.string().max(40),
        Nationality: z.string().max(2)
    }).optional(),
    PickAndShip: z.object({
        PickupDate: z.iso.date(),
    }).optional(),
    PickAndReturn: z.object({
        PickupDate: z.iso.date(),
    }).optional(),
    InboundLogistics: z.object().optional(),
    DocumentReturnService: z.object().optional(),
    CompleteDeliveryConsignmentService: z.object().optional(),
    FlexDeliveryService: z.object().optional(),
    SignatureService: z.object().optional(),
    T24Service: z.object().optional(),
    T48Service: z.object().optional(),
    Guaranteed24Service: z.object().optional(),
    AddresseeOnlyService: z.object().optional(),
    TyreService: z.object().optional(),
    '0800Service': z.object().optional(),
    '0900Service': z.object().optional(),
    '1000Service': z.object().optional(),
    '1200Service': z.object().optional(),
    '1300Service': z.object().optional(),
    EOB: z.object().optional(),
    Saturday1000Service: z.object().optional(),
    Saturday1200Service: z.object().optional(),
    SaturdayService: z.object().optional(),
})).optional()
export type ShipmentService = z.infer<typeof ShipmentServiceSchema>
export const InternalShipmentServiceSchema = z.array(z.object({
    Service: z.object({
        serviceName: z.string()
    }).optional(),
    ShopDelivery: z.object({
        serviceName: z.string().default("service_shopdelivery"),
        ParcelShopID: z.string().max(50)
    }).optional(),
    ShopReturn: z.object({
        serviceName: z.string().default("service_shopreturn"),
        NumberOfLabels: z.number(),
        ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional()
    }).optional(),
    Intercompany: z.object({
        serviceName: z.string().default("service_intercompany"),
        Address: AddressSchema,
        NumberOfLabels: z.number().min(1),
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    Exchange: z.object({
        serviceName: z.string().default("service_exchange"),
        Address: AddressSchema,
        ExpectedWeight: z.number().min(1).optional()
    }).optional(),
    DeliveryAtWork: z.object({
        serviceName: z.string().default("service_deliveryatwork"),
        RecipientName: z.string().max(40),
        AlternateRecipientName: z.string().max(40).optional(),
        Building: z.string().max(40),
        Floor: z.number(),
        Room: z.number().optional(),
        Phonenumber: z.string().max(35).optional()
    }).optional(),
    Deposit: z.object({
        serviceName: z.string().default("service_deposit"),
        PlaceOfDeposit: z.string().max(121),
    }).optional(),
    IdentPin: z.object({
        serviceName: z.string().default("service_identpin"),
        PIN: z.string().max(4),
        Birthdate: z.date().optional()
    }).optional(),
    Ident: z.object({
        serviceName: z.string().default("service_ident"),
        Birthdate: z.date(),
        Firstname: z.string().max(40),
        Lastname: z.string().max(40),
        Nationality: z.string().max(2)
    }).optional(),
    PickAndShip: z.object({
        serviceName: z.string().default("service_pickandship"),
        PickupDate: z.date(),
    }).optional(),
    PickAndReturn: z.object({
        serviceName: z.string().default("service_pickandreturn"),
        PickupDate: z.date(),
    }).optional(),
    InboundLogistics: z.object({
        serviceName: z.string().default("service_inbound"),
    }).optional(),
    DocumentReturnService: z.object({
        serviceName: z.string().default("service_documentreturn"),
    }).optional(),
    CompleteDeliveryConsignmentService: z.object({
        serviceName: z.string().default("service_completedeliveryconsignment"),
    }).optional(),
    FlexDeliveryConsignmentService: z.object({
        serviceName: z.string().default("service_flexdelivery"),
    }).optional(),
    SignatureService: z.object({
        serviceName: z.string().default("service_signature"),
    }).optional(),
    T24Service: z.object({
        serviceName: z.string().default("service_t24"),
    }).optional(),
    T48Service: z.object({
        serviceName: z.string().default("service_t48"),
    }).optional(),
    Guaranteed24Service: z.object({
        serviceName: z.string().default("service_guaranteed24"),
    }).optional(),
    AddresseeOnlyService: z.object({
        serviceName: z.string().default("service_addresseeonly"),
    }).optional(),
    TyreService: z.object({
        serviceName: z.string().default("service_tyre"),
    }).optional(),
    '0800Service': z.object({
        serviceName: z.string().default("service_0800"),
    }).optional(),
    '0900Service': z.object({
        serviceName: z.string().default("service_0900"),
    }).optional(),
    '1000Service': z.object({
        serviceName: z.string().default("service_1000"),
    }).optional(),
    '1200Service': z.object({
        serviceName: z.string().default("service_1200"),
    }).optional(),
    '1300Service': z.object({
        serviceName: z.string().default("service_1300"),
    }).optional(),
    Saturday1000Service: z.object({
        serviceName: z.string().default("service_saturday_1000"),
    }).optional(),
    Saturday1200Service: z.object({
        serviceName: z.string().default("service_saturday_1200"),
    }).optional(),
    SaturdayService: z.object({
        serviceName: z.string().default("service_Saturday"),
    }).optional(),
})).optional()

export function register(sdk: ActionSdk) {
    return sdk.registerDataTypes(
        {
            identifier: "GLS_SHIPMENT_SERVICE",
            type: zodSchemaToTypescriptDefs(
                "XXX",
                ShipmentSchema,
                {
                    GLS_SHIPMENT_SERVICE: ShipmentServiceSchema,
                }
            ).get("GLS_SHIPMENT_SERVICE")!, // Hacky way because shipment service is defined as an array
            name: [
                {
                    code: "en-US",
                    content: "Shipment Service"
                }
            ],
            displayMessage: [
                {
                    code: "en-US",
                    content: "Shipment Service"
                }
            ],
            linkedDataTypes: [
                "GLS_ADDRESS"
            ]
        },
    )
}
