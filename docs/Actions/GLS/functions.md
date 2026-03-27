---
title: GLS Action Functions
description: All functions available in the GLS Action with detailed descriptions, parameters, and data flow diagrams.
---

# GLS Action Functions

The GLS Action exposes **26 functions** grouped into three categories:

- **Builder functions** — Construct data objects (no API call)
- **Shipment functions** — Create different types of GLS shipments (calls GLS API)
- **API functions** — Query or modify shipments (calls GLS API)

---

## Builder functions

### `createAddress`

Creates a GLS address object (`GLS_ADDRESS`) for use in shipments as consignee, shipper, or return address.

**Signature:**
```
createAddress(
  Name1: string,
  CountryCode: string,
  City: string,
  Street: string,
  ZIPCode: string,
  Name2?: string,
  Name3?: string,
  Province?: string,
  StreetNumber?: string,
  ContactPerson?: string,
  FixedLinePhonenumber?: string,
  MobilePhonenumber?: string,
  Email?: string
): GLS_ADDRESS
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `Name1` | string (max 40) | **Yes** | Primary name (recipient or company name) |
| `CountryCode` | string (max 2) | **Yes** | ISO alpha-2 country code (e.g. `DE`, `FR`, `GB`) |
| `City` | string (max 40) | **Yes** | City name |
| `Street` | string (min 4) | **Yes** | Street name |
| `ZIPCode` | string (max 10) | **Yes** | Postal/ZIP code |
| `Name2` | string (max 40) | No | Additional name line (e.g. department) |
| `Name3` | string (max 40) | No | Additional name line (e.g. c/o) |
| `Province` | string (max 40) | No | State or province |
| `StreetNumber` | string (max 40) | No | House/building number |
| `ContactPerson` | string (min 6, max 40) | No | Contact person at this address |
| `FixedLinePhonenumber` | string (min 4, max 35) | No | Landline phone number |
| `MobilePhonenumber` | string (min 4, max 35) | No | Mobile phone number |
| `eMail` | string (max 80) | No | Email address |

**Returns:** [`GLS_ADDRESS`](../GLS/types.md#GLS_ADDRESS)

---

### `createConsignee`

Creates a GLS consignee (recipient) object for use in shipments.

**Signature:**
```
createConsignee(
  consigneeId: string,
  costCenter: string,
  Address: GLS_ADDRESS,
  Category: "BUSINESS" | "PRIVATE"
): GLS_CONSIGNEE
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `consigneeId` | string (max 40) | **Yes** | Unique ID for the consignee (your internal customer ID) |
| `costCenter` | string (max 80) | **Yes** | Cost center for billing purposes |
| `Address` | GLS_ADDRESS | **Yes** | The delivery address for this consignee |
| `Category` | `"BUSINESS"` \| `"PRIVATE"` | **Yes** | Whether the consignee is a business or private recipient |

**Returns:** [`GLS_CONSIGNEE`](../GLS/types.md#GLS_CONSIGNEE)

---

### `createShipmentUnit`

Creates a GLS shipment unit (an individual parcel within a shipment).

**Signature:**
```
createShipmentUnit(
  weight: number,
  shipmentUnitReference?: string,
  partnerParcelNumber?: string,
  note1?: string,
  note2?: string,
  shipmentUnitService: GLS_UNIT_SERVICE
): GLS_SHIPMENT_UNIT
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `weight` | number (0.10–99) | **Yes** | Weight of the parcel in kilograms |
| `shipmentUnitReference` | string (max 40) | No | Your internal reference for this parcel |
| `partnerParcelNumber` | string (max 50) | No | Partner-assigned parcel number |
| `note1` | string (max 50) | No | Additional note printed on the label (line 1) |
| `note2` | string (max 50) | No | Additional note printed on the label (line 2) |
| `shipmentUnitService` | GLS_UNIT_SERVICE | No | Unit-level services (Cash, AddonLiability, HazardousGoods, etc.) |

**Returns:** [`GLS_SHIPMENT_UNIT`](../GLS/types.md#GLS_SHIPMENT_UNIT)

---

### `createPrintingOptions`

Creates GLS printing options that control how labels are generated.

**Signature:**
```
createPrintingOptions(returnLabels: RETURN_LABELS): GLS_PRINTING_OPTIONS
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `returnLabels` | RETURN_LABELS | **Yes** | Label format configuration |

`RETURN_LABELS` fields:

| Field | Values | Description |
|-------|--------|-------------|
| `TemplateSet` | `NONE`, `D_200`, `PF_4_I`, `ZPL_200`, `ZPL_300`, ... | Label template set |
| `LabelFormat` | `PDF`, `ZEBRA`, `INTERMEC`, `DATAMAX`, `TOSHIBA`, `PNG` | Output format |

**Returns:** [`GLS_PRINTING_OPTIONS`](../GLS/types.md#GLS_PRINTING_OPTIONS)

---

### `createCustomContent`

Creates custom content settings for GLS labels, including logos and barcodes.

**Signature:**
```
createCustomContent(
  barcodeContentType: "TRACK_ID" | "GLS_SHIPMENT_REFERENCE",
  customerLogo: string,
  hideShipperAddress?: boolean,
  barcodeType?: "EAN_128" | "CODE_39",
  barcode?: string
): GLS_CUSTOM_CONTENT
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `barcodeContentType` | `"TRACK_ID"` \| `"GLS_SHIPMENT_REFERENCE"` | **Yes** | What the barcode encodes |
| `customerLogo` | string | **Yes** | Base64-encoded customer logo image |
| `hideShipperAddress` | boolean | No | Hide the shipper address on the label |
| `barcodeType` | `"EAN_128"` \| `"CODE_39"` | No | Barcode symbology |
| `barcode` | string | No | Custom barcode value |

**Returns:** [`GLS_CUSTOM_CONTENT`](../GLS/types.md#GLS_CUSTOM_CONTENT)

---

## Shipment functions

All shipment functions accept a common set of parameters in addition to their type-specific parameters. They call the GLS ShipIT API (`POST /rs/shipments`) and return a `GLS_CREATE_PARCELS_RESPONSE`.

**Common parameters for all shipment functions:**

| Parameter         | Type                          | Required | Description                                        |
|-------------------|-------------------------------|----------|----------------------------------------------------|
| `shipment`        | GLS_SHIPMENT_WITHOUT_SERVICES | **Yes**  | Shipment data (consignee, shipper, units, product) |
| `printingOptions` | GLS_PRINTING_OPTIONS          | **Yes**  | Label format settings                              |
| `returnOptions`   | GLS_RETURN_OPTIONS            | No       | Whether to return print data and routing info      |
| `customContent`   | GLS_CUSTOM_CONTENT            | No       | Custom logo and barcode settings                   |

---

### `createShopDeliveryShipment`

Delivers a parcel to a GLS Parcel Shop where the recipient can collect it.

**Signature:**
```
createShopDeliveryShipment(
  parcelShopId: string,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parcelShopId` | string | **Yes** | ID of the target GLS Parcel Shop |

**Data flow:**
```
createShopDeliveryShipment
    │
    ├── Service: [{ ShopDelivery: { ParcelShopID } }]
    │
    └── POST /rs/shipments → GLS_CREATE_PARCELS_RESPONSE
```

---

### `createShopReturnShipment`

Creates a return shipment from a GLS Parcel Shop (customer drops off parcel at a shop).

**Signature:**
```
createShopReturnShipment(
  numberOfLabels: number,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT,
  returnQR?: "PDF" | "PNG" | "ZPL"
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `numberOfLabels` | number | **Yes** | Number of return labels to generate |
| `returnQR` | `"PDF"` \| `"PNG"` \| `"ZPL"` | No | Format of the QR code for the return |

---

### `createExchangeShipment`

Delivers a new parcel while simultaneously picking up an existing one (exchange).

**Signature:**
```
createExchangeShipment(
  address: GLS_ADDRESS,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT,
  expectedWeight?: number
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | GLS_ADDRESS | **Yes** | Address for the exchange pickup |
| `expectedWeight` | number (min 1) | No | Expected weight of the parcel being returned |

---

### `createDeliveryAtWorkShipment`

Delivers a parcel to a specific location within a workplace (building, floor, room).

**Signature:**
```
createDeliveryAtWorkShipment(
  recipientName: string,
  building: string,
  floor: number,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT,
  alternateRecipientName?: string,
  room?: number,
  phonenumber?: string
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `recipientName` | string (max 40) | **Yes** | Name of the recipient at work |
| `building` | string (max 40) | **Yes** | Building name or number |
| `floor` | number | **Yes** | Floor number |
| `alternateRecipientName` | string (max 40) | No | Alternate recipient if primary is unavailable |
| `room` | number | No | Room number |
| `phonenumber` | string (max 35) | No | Contact phone number |

---

### `createDepositShipment`

Delivers a parcel to a designated deposit location (e.g. a garage or shed) without requiring a signature.

**Signature:**
```
createDepositShipment(
  placeOfDeposit: string,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `placeOfDeposit` | string (max 121) | **Yes** | Description of where to deposit the parcel |

---

### `createIdentShipment`

Delivers a parcel with identity verification — the driver checks the recipient's ID document.

**Signature:**
```
createIdentShipment(
  birthDate: string,
  firstName: string,
  lastName: string,
  nationality: string,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `birthDate` | ISO date string | **Yes** | Recipient's date of birth |
| `firstName` | string (max 40) | **Yes** | Recipient's first name |
| `lastName` | string (max 40) | **Yes** | Recipient's last name |
| `nationality` | string (max 2) | **Yes** | ISO alpha-2 nationality code |

---

### `createIdentPinShipment`

Delivers a parcel with PIN and optional birthdate verification.

**Signature:**
```
createIdentPinShipment(
  pin: string,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT,
  birthDate?: string
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pin` | string (max 4) | **Yes** | 4-digit PIN to verify with recipient |
| `birthDate` | ISO date string | No | Recipient's date of birth (additional check) |

---

### `createPickAndShipShipment`

Schedules a pickup from the consignee's address on a given date.

**Signature:**
```
createPickAndShipShipment(
  pickupDate: string,
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `pickupDate` | ISO date string | **Yes** | Date when GLS will pick up the parcel |

---

### `createFlexDeliveryShipment`

Creates a shipment with flexible delivery — the recipient can redirect or reschedule delivery.

**Signature:**
```
createFlexDeliveryShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

No additional parameters beyond the common ones.

---

### `createSignatureShipment`

Creates a shipment that requires a recipient signature upon delivery.

**Signature:**
```
createSignatureShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

No additional parameters beyond the common ones.

---

### `createGuaranteed24Shipment`

Creates a shipment with guaranteed delivery within 24 hours.

**Signature:**
```
createGuaranteed24Shipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

No additional parameters beyond the common ones.

---

### `createAddresseeOnlyShipment`

Creates a shipment that can only be delivered to the named addressee (no neighbor delivery).

**Signature:**
```
createAddresseeOnlyShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

No additional parameters beyond the common ones.

---

### `createTyreShipment`

Creates a shipment specifically for tyre/wheel delivery (uses the GLS TyreService).

**Signature:**
```
createTyreShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

No additional parameters beyond the common ones.

---

### `createDeliveryNextWorkingDayShipment`

Creates an **EXPRESS** shipment for delivery on the next working day (EOB service).

> **Requirement:** The shipment's `Product` field must be set to `"EXPRESS"`. Setting it to `"PARCEL"` will throw an `INVALID_PRODUCT` error.

**Signature:**
```
createDeliveryNextWorkingDayShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

---

### `createDeliverySaturdayShipment`

Creates an **EXPRESS** shipment for Saturday delivery.

> **Requirement:** The shipment's `Product` field must be set to `"EXPRESS"`. Setting it to `"PARCEL"` will throw an `INVALID_PRODUCT` error.

**Signature:**
```
createDeliverySaturdayShipment(
  shipment: GLS_SHIPMENT_WITHOUT_SERVICES,
  printingOptions: GLS_PRINTING_OPTIONS,
  returnOptions?: GLS_RETURN_OPTIONS,
  customContent?: GLS_CUSTOM_CONTENT
): GLS_CREATE_PARCELS_RESPONSE
```

---

## API functions

### `validateShipment`

Validates a shipment against the GLS API without creating it. Use this before `createShipment*` functions to catch errors early.

**Signature:**
```
validateShipment(data: GLS_VALIDATE_SHIPMENT_REQUEST_DATA): GLS_VALIDATE_SHIPMENT_RESPONSE_DATA
```

**Data flow:**
```
validateShipment
    │
    └── POST /rs/shipments/validate
              │
              ▼
    GLS_VALIDATE_SHIPMENT_RESPONSE_DATA
      ├── success: boolean
      └── validationResult.Issues[]
```

See [Types — GLS_VALIDATE_SHIPMENT_REQUEST_DATA](../GLS/types.md#GLS_VALIDATE_SHIPMENT_REQUEST_DATA) for the input format.

---

### `cancelShipment`

Cancels an existing shipment by its Track ID. Only possible if the parcel has not yet been scanned.

**Signature:**
```
cancelShipment(data: GLS_CANCEL_SHIPMENT_REQUEST_DATA): GLS_CANCEL_SHIPMENT_RESPONSE_DATA
```

**Data flow:**
```
cancelShipment({ TrackID })
    │
    └── POST /rs/shipments/cancel/{TrackID}
              │
              ▼
    GLS_CANCEL_SHIPMENT_RESPONSE_DATA
      ├── TrackID
      └── result: "CANCELLED" | "CANCELLATION_PENDING" | "SCANNED" | "ERROR"
```

---

### `getAllowedServices`

Returns the GLS services available for a given origin/destination country and ZIP code combination.

**Signature:**
```
getAllowedServices(data: GLS_ALLOWED_SERVICES_REQUEST_DATA): GLS_ALLOWED_SERVICES_RESPONSE_DATA
```

**Data flow:**
```
getAllowedServices({ Source, Destination, ContactID? })
    │
    └── GET /rs/shipments/allowedservices
              │
              ▼
    GLS_ALLOWED_SERVICES_RESPONSE_DATA
      └── AllowedServices[]: { ServiceName } | { ProductName }
```

---

### `getEndOfDayReport`

Retrieves all shipments dispatched on a given date. Useful for reconciliation and end-of-day processing.

**Signature:**
```
getEndOfDayReport(data: GLS_END_OF_DAY_REQUEST_DATA): GLS_END_OF_DAY_RESPONSE_DATA
```

**Data flow:**
```
getEndOfDayReport({ date })
    │
    └── GET /rs/shipments/endofday?date={date}
              │
              ▼
    GLS_END_OF_DAY_RESPONSE_DATA
      └── Shipments[]: { ShippingDate, Product, Consignee, Shipper, ShipmentUnit[] }
```

---

### `updateParcelWeight`

Updates the weight of an already-created parcel. Useful when the final weight is only known after packaging.

**Signature:**
```
updateParcelWeight(data: GLS_UPDATE_PARCEL_WEIGHT_REQUEST_DATA): GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA
```

**Data flow:**
```
updateParcelWeight({ TrackID, Weight })
    │
    └── POST /rs/shipments/updateparcelweight
              │
              ▼
    GLS_UPDATE_PARCEL_WEIGHT_RESPONSE_DATA
      └── UpdatedWeight: string
```

---

### `reprintParcel`

Reprints the label for an existing parcel. Use this if the original label is damaged, lost, or needs to be printed in a different format.

**Signature:**
```
reprintParcel(data: GLS_REPRINT_PARCEL_REQUEST_DATA): GLS_REPRINT_PARCEL_RESPONSE_DATA
```

**Data flow:**
```
reprintParcel({ TrackID, CreationDate, PrintingOptions })
    │
    └── POST /rs/shipments/reprintparcel
              │
              ▼
    GLS_REPRINT_PARCEL_RESPONSE_DATA
      └── CreatedShipment
            ├── ParcelData[].TrackID
            ├── ParcelData[].Barcodes
            └── PrintData[].Data  ← new base64-encoded label
```
