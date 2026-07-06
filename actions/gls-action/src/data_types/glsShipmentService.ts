import { z } from "zod";
import { AddressSchema } from "./glsAddress.js";

export const ShipmentServiceSchema = z.array(
    z.object({
        Service: z.object({
            ServiceName: z.enum([
                "service_inbound",
                "service_documentreturn",
                "service_completedeliveryconsignment",
                "service_flexdelivery",
                "service_signature",
                "service_t24",
                "service_t48",
                "service_guaranteed24",
                "service_addresseeonly",
                "service_tyre",
                "service_eob",
                "service_0800",
                "service_0900",
                "service_1000",
                "service_1200",
                "service_1300",
                "service_saturday_1000",
                "service_saturday_1200",
                "service_Saturday",
            ]),
        }).optional(),
        ShopDelivery: z.object({
            ParcelShopID: z.string().max(50),
        }).optional(),
        ShopReturn: z.object({
            NumberOfLabels: z.number(),
            ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional(),
        }).optional(),
        Intercompany: z.object({
            Address: AddressSchema,
            NumberOfLabels: z.number().min(1),
            ExpectedWeight: z.number().min(1).optional(),
        }).optional(),
        Exchange: z.object({
            Address: AddressSchema,
            ExpectedWeight: z.number().min(1).optional(),
        }).optional(),
        DeliveryAtWork: z.object({
            RecipientName: z.string().max(40),
            AlternateRecipientName: z.string().max(40).optional(),
            Building: z.string().max(40),
            Floor: z.number(),
            Room: z.number().optional(),
            Phonenumber: z.string().max(35).optional(),
        }).optional(),
        Deposit: z.object({
            PlaceOfDeposit: z.string().max(121),
        }).optional(),
        IdentPin: z.object({
            PIN: z.string().max(4),
            Birthdate: z.iso.date().optional(),
        }).optional(),
        Ident: z.object({
            Birthdate: z.iso.date(),
            Firstname: z.string().max(40),
            Lastname: z.string().max(40),
            Nationality: z.string().max(2),
        }).optional(),
        PickAndShip: z.object({
            PickupDate: z.iso.date(),
        }).optional(),
        PickAndReturn: z.object({
            PickupDate: z.iso.date(),
        }).optional(),
    })
).optional();
export type ShipmentService = z.infer<typeof ShipmentServiceSchema>;

export const InternalShipmentServiceSchema = z.array(
    z.object({
        Service: z.object({
            ServiceName: z.enum([
                "service_inbound",
                "service_documentreturn",
                "service_completedeliveryconsignment",
                "service_flexdelivery",
                "service_signature",
                "service_t24",
                "service_t48",
                "service_guaranteed24",
                "service_addresseeonly",
                "service_tyre",
                "service_eob",
                "service_0800",
                "service_0900",
                "service_1000",
                "service_1200",
                "service_1300",
                "service_saturday_1000",
                "service_saturday_1200",
                "service_Saturday",
            ]),
        }).optional(),
        ShopDelivery: z.object({
            ServiceName: z.string().default("service_shopdelivery"),
            ParcelShopID: z.string().max(50),
        }).optional(),
        ShopReturn: z.object({
            ServiceName: z.string().default("service_shopreturn"),
            NumberOfLabels: z.number(),
            ReturnQR: z.enum(["PDF", "PNG", "ZPL"]).optional(),
        }).optional(),
        Intercompany: z.object({
            ServiceName: z.string().default("service_intercompany"),
            Address: AddressSchema,
            NumberOfLabels: z.number().min(1),
            ExpectedWeight: z.number().min(1).optional(),
        }).optional(),
        Exchange: z.object({
            ServiceName: z.string().default("service_exchange"),
            Address: AddressSchema,
            ExpectedWeight: z.number().min(1).optional(),
        }).optional(),
        DeliveryAtWork: z.object({
            ServiceName: z.string().default("service_deliveryatwork"),
            RecipientName: z.string().max(40),
            AlternateRecipientName: z.string().max(40).optional(),
            Building: z.string().max(40),
            Floor: z.number(),
            Room: z.number().optional(),
            Phonenumber: z.string().max(35).optional(),
        }).optional(),
        Deposit: z.object({
            ServiceName: z.string().default("service_deposit"),
            PlaceOfDeposit: z.string().max(121),
        }).optional(),
        IdentPin: z.object({
            ServiceName: z.string().default("service_identpin"),
            PIN: z.string().max(4),
            Birthdate: z.iso.date().optional(),
        }).optional(),
        Ident: z.object({
            ServiceName: z.string().default("service_ident"),
            Birthdate: z.iso.date(),
            Firstname: z.string().max(40),
            Lastname: z.string().max(40),
            Nationality: z.string().max(2),
        }).optional(),
        PickAndShip: z.object({
            ServiceName: z.string().default("service_pickandship"),
            PickupDate: z.iso.date(),
        }).optional(),
        PickAndReturn: z.object({
            ServiceName: z.string().default("service_pickandreturn"),
            PickupDate: z.iso.date(),
        }).optional(),
    })
).optional();
