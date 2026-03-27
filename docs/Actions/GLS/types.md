---
title: Datatypes
description: All data types registered by the GLS Action — field references and descriptions.
---

# GLS Action Types

The GLS Action registers the following data types with the Hercules platform. These types are used as inputs and outputs
of the GLS functions and can be referenced in your flows.

---

## `GLS_ADDRESS`

Represents a physical address used for consignee, shipper, and return addresses.

**Used by:** `GLS_CONSIGNEE`, `GLS_SHIPPER`, `GLS_SHIPMENT_SERVICE` (Exchange, DeliveryAtWork, etc.)

| Field                  | Type   | Required | Constraints   | Description                                |
|------------------------|--------|----------|---------------|--------------------------------------------|
| `Name1`                | string | **Yes**  | max 40        | Primary name (person or company)           |
| `Name2`                | string | No       | max 40        | Additional name line (e.g. department)     |
| `Name3`                | string | No       | max 40        | Additional name line (e.g. c/o)            |
| `CountryCode`          | string | **Yes**  | max 2         | ISO alpha-2 country code (e.g. `DE`, `FR`) |
| `Province`             | string | No       | max 40        | State or province                          |
| `City`                 | string | **Yes**  | max 40        | City name                                  |
| `Street`               | string | **Yes**  | min 4         | Street name                                |
| `StreetNumber`         | string | No       | max 40        | House/building number                      |
| `ContactPerson`        | string | No       | min 6, max 40 | Contact person name                        |
| `FixedLinePhonenumber` | string | No       | min 4, max 35 | Landline phone number                      |
| `MobilePhonenumber`    | string | No       | min 4, max 35 | Mobile phone number                        |
| `eMail`                | string | No       | max 80        | Email address                              |
| `ZIPCode`              | string | **Yes**  | max 10        | Postal/ZIP code                            |

---

## `GLS_CONSIGNEE`

Represents the recipient of a shipment.

**Used by:** `GLS_SHIPMENT`

**Linked types:** `GLS_ADDRESS`

| Field         | Type                        | Required | Constraints | Description                         |
|---------------|-----------------------------|----------|-------------|-------------------------------------|
| `ConsigneeID` | string                      | No       | max 40      | Your internal customer/consignee ID |
| `CostCenter`  | string                      | No       | max 80      | Cost center for billing             |
| `Category`    | `"BUSINESS"` \| `"PRIVATE"` | No       | —           | Type of recipient                   |
| `AddressSchema`     | GLS_ADDRESS                 | **Yes**  | —           | Physical delivery address           |

---

## `GLS_SHIPPER`

Represents the sender of a shipment.

**Used by:** `GLS_SHIPMENT`, action configuration

**Linked types:** `GLS_ADDRESS`

| Field                       | Type        | Required | Description                               |
|-----------------------------|-------------|----------|-------------------------------------------|
| `AddressSchema`                   | GLS_ADDRESS | No       | Primary shipper address                   |
| `AlternativeShipperAddress` | GLS_ADDRESS | No       | Alternative address to print on the label |

> **Note:** When used in the configuration (`shipper`), the action automatically includes the `ContactID` from the
`contact_id` configuration value.

---

## `GLS_UNIT_SERVICE`

An optional array of value-added services applied to an individual shipment unit (parcel).

**Used by:** `GLS_SHIPMENT_UNIT`

Each element is an object with one or more of the following optional fields:

| Service field       | Description                                                                      |
|---------------------|----------------------------------------------------------------------------------|
| `Cash`              | Cash on delivery — `Reason` (max 160), `Amount` (min 1), `Currency` (3 chars)    |
| `AddonLiability`    | Additional liability insurance — `Amount`, `Currency`, `ParcelContent` (max 255) |
| `HazardousGoods`    | Hazardous goods declaration — array of `{ Weight, GLSHazNo (max 8) }`            |
| `ExWorks`           | Ex-works shipping terms                                                          |
| `LimitedQuantities` | Limited quantities of dangerous goods — optional `Weight`                        |

---

## `GLS_SHIPMENT_UNIT`

Represents a single parcel within a shipment. A shipment may contain multiple units.

**Used by:** `GLS_SHIPMENT`, `GLS_SHIPMENT_WITHOUT_SERVICES`

**Linked types:** `GLS_UNIT_SERVICE`

| Field                   | Type             | Required | Constraints | Description                     |
|-------------------------|------------------|----------|-------------|---------------------------------|
| `Weight`                | number           | **Yes**  | 0.10–99 kg  | Weight of the parcel            |
| `ShipmentUnitReference` | string           | No       | max 40      | Your internal parcel reference  |
| `PartnerParcelNumber`   | string           | No       | max 50      | Partner-assigned number         |
| `Note1`                 | string           | No       | max 50      | Label note line 1               |
| `Note2`                 | string           | No       | max 50      | Label note line 2               |
| `Service`               | GLS_UNIT_SERVICE | No       | —           | Unit-level value-added services |

---

## `GLS_SHIPMENT_SERVICE`

An optional array of shipment-level services. Shipment creation functions automatically populate this based on which
function you call.

**Used by:** `GLS_SHIPMENT`

Each element is an object with one of the following service fields:

| Service                | Parameters                                                                               | Description                        |
|------------------------|------------------------------------------------------------------------------------------|------------------------------------|
| `ShopDelivery`         | `ParcelShopID` (max 50)                                                                  | Delivery to a GLS Parcel Shop      |
| `ShopReturn`           | `NumberOfLabels`, `ReturnQR?`                                                            | Return from a Parcel Shop          |
| `Exchange`             | `AddressSchema` (GLS_ADDRESS), `ExpectedWeight?`                                               | Exchange delivery and pickup       |
| `DeliveryAtWork`       | `RecipientName`, `Building`, `Floor`, `Room?`, `Phonenumber?`, `AlternateRecipientName?` | Workplace delivery                 |
| `Deposit`              | `PlaceOfDeposit` (max 121)                                                               | Deposit without signature          |
| `IdentPin`             | `PIN` (max 4), `Birthdate?`                                                              | PIN-based identity check           |
| `Ident`                | `Birthdate`, `Firstname`, `Lastname`, `Nationality` (max 2)                              | Full identity check                |
| `PickAndShip`          | `PickupDate`                                                                             | GLS picks up from consignee        |
| `FlexDeliveryService`  | —                                                                                        | Recipient can redirect delivery    |
| `SignatureService`     | —                                                                                        | Signature required on delivery     |
| `Guaranteed24Service`  | —                                                                                        | 24-hour guaranteed delivery        |
| `AddresseeOnlyService` | —                                                                                        | Delivery to named addressee only   |
| `TyreService`          | —                                                                                        | Tyre/wheel delivery service        |
| `EOB`                  | —                                                                                        | End of Business (next working day) |
| `SaturdayService`      | —                                                                                        | Saturday delivery                  |
| `Saturday1000Service`  | —                                                                                        | Saturday by 10:00                  |
| `Saturday1200Service`  | —                                                                                        | Saturday by 12:00                  |

---

## `GLS_SHIPMENT`

The complete shipment object including all services.

**Used by:** `GLS_VALIDATE_SHIPMENT_REQUEST_DATA`

**Linked types:** `GLS_CONSIGNEE`, `GLS_SHIPPER`, `GLS_SHIPMENT_UNIT`, `GLS_SHIPMENT_SERVICE`, `GLS_ADDRESS`

| Field                       | Type                      | Required | Description                                      |
|-----------------------------|---------------------------|----------|--------------------------------------------------|
| `Product`                   | `"PARCEL"` \| `"EXPRESS"` | **Yes**  | Shipment product type                            |
| `ConsigneeSchema`                 | GLS_CONSIGNEE             | **Yes**  | Recipient details                                |
| `ShipperSchema`                   | GLS_SHIPPER               | **Yes**  | Sender details                                   |
| `ShipmentUnit`              | GLS_SHIPMENT_UNIT[]       | **Yes**  | Array of parcels (min 1)                         |
| `Service`                   | GLS_SHIPMENT_SERVICE      | No       | Shipment-level services                          |
| `ShipmentReference`         | string (max 40)           | No       | Your internal shipment reference                 |
| `ShipmentDate`              | date                      | No       | Shipment date (defaults to today)                |
| `IncotermCode`              | integer (max 99)          | No       | International commerce terms code                |
| `Identifier`                | string (max 40)           | No       | Additional identifier                            |
| `ExpressAltDeliveryAllowed` | boolean                   | No       | Allow alternative delivery for express shipments |
| `Carrier`                   | `"ROYALMAIL"`             | No       | Override carrier (UK only)                       |
| `Return.AddressSchema`            | GLS_ADDRESS               | No       | AddressSchema for return shipments                     |

---

## `GLS_SHIPMENT_WITHOUT_SERVICES`

The shipment object without the `Service` field. Used as input to all shipment creation functions — the service is added
automatically based on which function you call.

**Linked types:** `GLS_SHIPMENT`

Same fields as `GLS_SHIPMENT` except `Service` is omitted.

---

## `GLS_PRINTING_OPTIONS`

Configures how shipping labels are generated.

| Field                           | Type   | Required | Description                                                                                              |
|---------------------------------|--------|----------|----------------------------------------------------------------------------------------------------------|
| `ReturnLabels.TemplateSet`      | enum   | **Yes**  | Label template to use                                                                                    |
| `ReturnLabels.LabelFormat`      | enum   | **Yes**  | Output file format                                                                                       |
| `useDefault`                    | string | No       | If set to `"Default"`, uses the default printing options configured in GLS instead of the specified ones |
| `DefinePrinter.LabelPrinter`    | string | No       | Specify the printer name, only backend printers are valid                                                |
| `DefinePrinter.DocumentPrinter` | string | no       | Specify the document printer name, only backend printers are valid                                       |

**Template sets:** `NONE`, `D_200`, `PF_4_I`, `PF_4_I_200`, `PF_4_I_300`, `PF_8_D_200`, `T_200_BF`, `T_300_BF`,
`ZPL_200`, `ZPL_200_TRACKID_EAN_128`, `ZPL_200_TRACKID_CODE_39`, `ZPL_200_REFNO_EAN_128`, `ZPL_200_REFNO_CODE_39`,
`ZPL_300`, `ZPL_300_TRACKID_EAN_128`, `ZPL_300_TRACKID_CODE_39`, `ZPL_300_REFNO_EAN_128`, `ZPL_300_REFNO_CODE_39`

**Label formats:** `PDF`, `ZEBRA`, `INTERMEC`, `DATAMAX`, `TOSHIBA`, `PNG`

---

## `GLS_RETURN_OPTIONS`

Controls whether the GLS API includes print data and routing info in the response.

| Field               | Type    | Default | Description                              |
|---------------------|---------|---------|------------------------------------------|
| `ReturnPrintData`   | boolean | `true`  | Include base64-encoded label in response |
| `ReturnRoutingInfo` | boolean | `true`  | Include routing information in response  |

> Set both to `false` if you only need the `TrackID` and don't need the label data immediately.

---

## `GLS_CUSTOM_CONTENT`

Customizes what appears on the printed shipping label.

| Field                | Type                                       | Required | Description                          |
|----------------------|--------------------------------------------|----------|--------------------------------------|
| `CustomerLogo`       | string                                     | **Yes**  | Base64-encoded logo image            |
| `BarcodeContentType` | `"TRACK_ID"` \| `"GLS_SHIPMENT_REFERENCE"` | **Yes**  | What to encode in the custom barcode |
| `Barcode`            | string                                     | No       | Custom barcode value                 |
| `BarcodeType`        | `"EAN_128"` \| `"CODE_39"`                 | No       | Barcode symbology                    |
| `HideShipperAddress` | boolean                                    | No       | Hide shipper address on label        |

---

## `GLS_CREATE_PARCELS_RESPONSE`

The response returned by all shipment creation functions.

| Field                                                        | Type             | Description                              |
|--------------------------------------------------------------|------------------|------------------------------------------|
| `CreatedShipment.ShipmentReference`                          | string[]         | Your shipment references                 |
| `CreatedShipment.ParcelData[].TrackID`                       | string (8 chars) | GLS tracking ID — use to track or cancel |
| `CreatedShipment.ParcelData[].ParcelNumber`                  | string           | GLS parcel number                        |
| `CreatedShipment.ParcelData[].Barcodes.Primary2D`            | string           | 2D barcode data                          |
| `CreatedShipment.ParcelData[].Barcodes.Secondary2D`          | string           | Secondary 2D barcode                     |
| `CreatedShipment.ParcelData[].Barcodes.Primary1D`            | string           | 1D barcode data                          |
| `CreatedShipment.ParcelData[].Barcodes.Primary1DPrint`       | boolean          | Whether to print 1D barcode              |
| `CreatedShipment.ParcelData[].RoutingInfo.Tour`              | string           | Delivery tour identifier                 |
| `CreatedShipment.ParcelData[].RoutingInfo.FinalLocationCode` | string           | Final delivery depot                     |
| `CreatedShipment.ParcelData[].RoutingInfo.HubLocation`       | string           | Hub location code                        |
| `CreatedShipment.ParcelData[].RoutingInfo.LastRoutingDate`   | date             | Last valid routing date                  |
| `CreatedShipment.PrintData[].Data`                           | string           | Base64-encoded label                     |
| `CreatedShipment.PrintData[].LabelFormat`                    | enum             | Format of the label                      |
| `CreatedShipment.CustomerID`                                 | string           | GLS customer identifier                  |
| `CreatedShipment.PickupLocation`                             | string           | Depot where parcel will be picked up     |
| `CreatedShipment.GDPR`                                       | string[]         | GDPR-related references                  |

---

## `GLS_CANCEL_SHIPMENT_REQUEST_DATA`

Input for the `cancelShipment` function.

| Field     | Type   | Required | Description                               |
|-----------|--------|----------|-------------------------------------------|
| `TrackID` | string | **Yes**  | GLS tracking ID of the shipment to cancel |

---

## `GLS_CANCEL_SHIPMENT_RESPONSE_DATA`

Response from the `cancelShipment` function.

| Field     | Type                                                                  | Description                        |
|-----------|-----------------------------------------------------------------------|------------------------------------|
| `TrackID` | string                                                                | The tracking ID that was cancelled |
| `result`  | `"CANCELLED"` \| `"CANCELLATION_PENDING"` \| `"SCANNED"` \| `"ERROR"` | Result of the cancellation         |

---

## `GLS_ALLOWED_SERVICES_REQUEST_DATA`

Input for the `getAllowedServices` function.

| Field                     | Type            | Required | Description                       |
|---------------------------|-----------------|----------|-----------------------------------|
| `Source.CountryCode`      | string (max 2)  | **Yes**  | Origin country code               |
| `Source.ZIPCode`          | string (max 10) | **Yes**  | Origin ZIP/postal code            |
| `Destination.CountryCode` | string (max 2)  | **Yes**  | Destination country code          |
| `Destination.ZIPCode`     | string (max 10) | **Yes**  | Destination ZIP/postal code       |
| `ContactID`               | string          | No       | GLS contact ID (overrides config) |

---

## `GLS_ALLOWED_SERVICES_RESPONSE_DATA`

Response from the `getAllowedServices` function.

| Field                           | Type   | Description                                          |
|---------------------------------|--------|------------------------------------------------------|
| `AllowedServices[]`             | array  | List of services or products available for the route |
| `AllowedServices[].ServiceName` | string | Name of an available service                         |
| `AllowedServices[].ProductName` | string | Name of an available product                         |

Each element contains either `ServiceName` or `ProductName`, not both.

---

## `GLS_END_OF_DAY_REQUEST_DATA`

Input for the `getEndOfDayReport` function.

| Field  | Type            | Required | Description                                                     |
|--------|-----------------|----------|-----------------------------------------------------------------|
| `date` | ISO date string | **Yes**  | The date for which to retrieve the report (e.g. `"2025-01-15"`) |

---

## `GLS_END_OF_DAY_RESPONSE_DATA`

Response from the `getEndOfDayReport` function.

| Field                                           | Type                      | Description                      |
|-------------------------------------------------|---------------------------|----------------------------------|
| `Shipments[].ShippingDate`                      | ISO date                  | Date the shipment was dispatched |
| `Shipments[].Product`                           | `"PARCEL"` \| `"EXPRESS"` | Product type                     |
| `Shipments[].ConsigneeSchema.AddressSchema`                 | GLS_ADDRESS               | Recipient address                |
| `Shipments[].ShipperSchema.ContactID`                 | string                    | GLS contact ID of shipper        |
| `Shipments[].ShipperSchema.AlternativeShipperAddress` | GLS_ADDRESS               | Alternative shipper address      |
| `Shipments[].ShipmentUnit[].TrackID`            | string                    | Tracking ID                      |
| `Shipments[].ShipmentUnit[].Weight`             | string                    | Parcel weight                    |
| `Shipments[].ShipmentUnit[].ParcelNumber`       | string                    | GLS parcel number                |

---

## `GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA`

Input for the `updateParcelWeight` function. Provide at least one identifier (`TrackID`, `ParcelNumber`,
`ShipmentReference`, `ShipmentUnitReference`, or `PartnerParcelNumber`).

| Field                   | Type   | Required | Constraints      | Description                |
|-------------------------|--------|----------|------------------|----------------------------|
| `TrackID`               | string | No       | max 8            | GLS tracking ID            |
| `ParcelNumber`          | number | No       | max 999999999999 | GLS parcel number          |
| `ShipmentReference`     | string | No       | max 40           | Your shipment reference    |
| `ShipmentUnitReference` | string | No       | max 40           | Your parcel unit reference |
| `PartnerParcelNumber`   | string | No       | max 50           | Partner parcel number      |
| `Weight`                | number | **Yes**  | min 0.10         | New weight in kilograms    |

---

## `GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA`

Response from the `updateParcelWeight` function.

| Field           | Type   | Description                    |
|-----------------|--------|--------------------------------|
| `UpdatedWeight` | string | Confirmed updated weight value |

---

## `GLS_REPRINT_PARCEL_REQUEST_DATA`

Input for the `reprintParcel` function. Provide at least one identifier.

| Field                                      | Type            | Required | Constraints                      | Description                     |
|--------------------------------------------|-----------------|----------|----------------------------------|---------------------------------|
| `TrackID`                                  | string          | No       | max 8                            | GLS tracking ID                 |
| `ParcelNumber`                             | number          | No       | max 999999999999                 | GLS parcel number               |
| `ShipmentReference`                        | string          | No       | max 40                           | Your shipment reference         |
| `ShipmentUnitReference`                    | string          | No       | max 40                           | Your parcel unit reference      |
| `PartnerParcelNumber`                      | string          | No       | max 50                           | Partner parcel number           |
| `CreationDate`                             | ISO date string | **Yes**  | —                                | Original shipment creation date |
| `PrintingOptions.ReturnLabels.TemplateSet` | enum            | **Yes**  | `NONE`, `ZPL_200`, `ZPL_300`     | Label template                  |
| `PrintingOptions.ReturnLabels.LabelFormat` | enum            | **Yes**  | `PDF`, `ZEBRA`, `PNG`, `PNG_200` | Output format                   |

---

## `GLS_REPRINT_PARCEL_RESPONSE_DATA`

Response from the `reprintParcel` function. Same structure as `GLS_CREATE_PARCELS_RESPONSE` without the
`ShipmentReference` and `GDPR` fields.

| Field                                                | Type     | Description                      |
|------------------------------------------------------|----------|----------------------------------|
| `CreatedShipment.ParcelData[].TrackID`               | string   | Tracking ID                      |
| `CreatedShipment.ParcelData[].ShipmentUnitReference` | string[] | Unit references                  |
| `CreatedShipment.ParcelData[].ParcelNumber`          | string   | Parcel number                    |
| `CreatedShipment.ParcelData[].Barcodes`              | object   | Barcode data                     |
| `CreatedShipment.ParcelData[].RoutingInfo`           | object   | Routing details                  |
| `CreatedShipment.PrintData[].Data`                   | string   | Base64-encoded label             |
| `CreatedShipment.PrintData[].LabelFormat`            | enum     | `PDF`, `ZEBRA`, `PNG`, `PNG_200` |
| `CreatedShipment.CustomerID`                         | string   | GLS customer identifier          |
| `CreatedShipment.PickupLocation`                     | string   | Depot pickup location            |
| `CreatedShipment.GDPR`                               | string[] | GDPR references                  |

---

## `GLS_VALIDATE_SHIPMENT_REQUEST_DATA`

Input for the `validateShipment` function.

| Field      | Type         | Required | Description                       |
|------------|--------------|----------|-----------------------------------|
| `Shipment` | GLS_SHIPMENT | **Yes**  | The complete shipment to validate |

---

## `GLS_VALIDATE_SHIPMENT_RESPONSE_DATA`

Response from the `validateShipment` function.

| Field                                  | Type     | Description                                      |
|----------------------------------------|----------|--------------------------------------------------|
| `success`                              | boolean  | Whether the shipment passed all validation rules |
| `validationResult.Issues[]`            | array    | List of validation issues (empty if valid)       |
| `validationResult.Issues[].Rule`       | string   | Name of the failed validation rule               |
| `validationResult.Issues[].Location`   | string   | Path in the data where the issue was found       |
| `validationResult.Issues[].Parameters` | string[] | Additional details about the issue               |

---

## Type dependency diagram

```
GLS_SHIPMENT_WITHOUT_SERVICES
    ├── ConsigneeSchema: GLS_CONSIGNEE
    │       └── AddressSchema: GLS_ADDRESS
    ├── ShipperSchema: GLS_SHIPPER
    │       ├── AddressSchema: GLS_ADDRESS
    │       └── AlternativeShipperAddress: GLS_ADDRESS
    └── ShipmentUnit[]: GLS_SHIPMENT_UNIT
            └── Service: GLS_UNIT_SERVICE

GLS_PRINTING_OPTIONS
    └── ReturnLabels: { TemplateSet, LabelFormat }

GLS_CUSTOM_CONTENT
    └── { CustomerLogo, BarcodeContentType, Barcode, BarcodeType, HideShipperAddress }

GLS_RETURN_OPTIONS
    └── { ReturnPrintData, ReturnRoutingInfo }

─── Shipment function ──────────────────────────────────────────────
[GLS_SHIPMENT_WITHOUT_SERVICES + GLS_PRINTING_OPTIONS + ...] → GLS_CREATE_PARCELS_RESPONSE
```
