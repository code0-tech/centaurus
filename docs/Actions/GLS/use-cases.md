---
title: Common Use Cases
description: End-to-end example flows using the GLS Action for real-world shipping scenarios.
---

# Common Use Cases

This page shows complete, real-world examples of flows built with the GLS Action. Each example includes a step-by-step breakdown and the data passed between functions.

---

## Use Case 1: Standard parcel delivery

**Scenario:** A customer places an order. You want to create a shipping label and send it to your label printer.

### Flow

```
[createAddress] (recipient)
        │ GLS_ADDRESS
[createAddress] (shipper)
        │ GLS_ADDRESS
[createShipmentUnit]
        │ GLS_SHIPMENT_UNIT
[createPrintingOptions]
        │ GLS_PRINTING_OPTIONS
[createShopDeliveryShipment]
        │ GLS_CREATE_PARCELS_RESPONSE
[send to printer / store TrackID]
```

### Step-by-step

**1. Create recipient address**
```
createAddress(
  Name1: "Jane Smith",
  CountryCode: "DE",
  City: "Hamburg",
  Street: "Reeperbahn",
  ZIPCode: "20359",
  StreetNumber: "1",
  eMail: "jane@example.com"
)
→ GLS_ADDRESS (recipient)
```

**2. Create parcel unit**
```
createShipmentUnit(
  weight: 1.2,
  shipmentUnitReference: "ORDER-12345",
  note1: "Handle with care"
)
→ GLS_SHIPMENT_UNIT
```

**3. Set printing options**
```
createPrintingOptions(
  returnLabels: {
    TemplateSet: "NONE",
    LabelFormat: "PDF"
  }
)
→ GLS_PRINTING_OPTIONS
```

**4. Create the shipment** (using default shipper from config)
```
createShopDeliveryShipment(
  parcelShopId: "PSH-HH-001",
  shipment: {
    Product: "PARCEL",
    Consignee: {
      ConsigneeID: "CUST-5678",
      Category: "PRIVATE",
      Address: <recipient GLS_ADDRESS>
    },
    Shipper: {},         ← uses default shipper from action config
    ShipmentUnit: [<GLS_SHIPMENT_UNIT>]
  },
  printingOptions: <GLS_PRINTING_OPTIONS>
)
→ GLS_CREATE_PARCELS_RESPONSE
```

**5. Use the response**
- Store `CreatedShipment.ParcelData[0].TrackID` in your order database
- Decode `CreatedShipment.PrintData[0].Data` (base64 PDF) and send to printer

---

## Use Case 2: Validate before creating

**Scenario:** You want to check a shipment for errors before submitting it, to avoid unnecessary API charges or failed deliveries.

### Flow

```
[Build shipment data] → GLS_SHIPMENT
        │
[validateShipment]
        │ GLS_VALIDATE_SHIPMENT_RESPONSE_DATA
        │
  success? ──Yes──→ [createShopDeliveryShipment]
        │
       No
        │
  [log errors / notify user]
```

### Example

**1. Validate the shipment**
```
validateShipment({
  Shipment: {
    Product: "PARCEL",
    Consignee: {
      Address: {
        Name1: "Test Recipient",
        CountryCode: "DE",
        City: "Berlin",
        Street: "Hauptstrasse",
        ZIPCode: "10115"
      }
    },
    Shipper: {},
    ShipmentUnit: [{ Weight: 0.5 }]
  }
})
→ GLS_VALIDATE_SHIPMENT_RESPONSE_DATA
```

**2. Check the result**
```json
{
  "success": true,
  "validationResult": { "Issues": [] }
}
```

If `success` is `false`, inspect `validationResult.Issues` for details:
```json
{
  "success": false,
  "validationResult": {
    "Issues": [
      {
        "Rule": "MIN_LENGTH",
        "Location": "Shipment.Consignee.Address.Street",
        "Parameters": ["4"]
      }
    ]
  }
}
```

---

## Use Case 3: Return shipment

**Scenario:** A customer wants to return an item. You generate a return label they can drop off at any GLS Parcel Shop.

### Flow

```
[createAddress] (your warehouse as consignee for return)
        │
[createShipmentUnit]
        │
[createPrintingOptions]
        │
[createShopReturnShipment]
        │ GLS_CREATE_PARCELS_RESPONSE
        │
[email PrintData to customer as PDF]
```

### Example

```
createShopReturnShipment(
  numberOfLabels: 1,
  shipment: {
    Product: "PARCEL",
    Consignee: {
      Address: {
        Name1: "My Warehouse GmbH",
        CountryCode: "DE",
        City: "Frankfurt",
        Street: "Lagerstrasse",
        ZIPCode: "60327"
      }
    },
    Shipper: {},
    ShipmentUnit: [{ Weight: 2.0 }]
  },
  printingOptions: {
    ReturnLabels: {
      TemplateSet: "NONE",
      LabelFormat: "PDF"
    }
  },
  returnQR: "PDF"
)
→ GLS_CREATE_PARCELS_RESPONSE
```

**Customer flow:**
1. Receive the PDF label by email
2. Print it (or show QR code on phone)
3. Drop off at any GLS Parcel Shop

---

## Use Case 4: Identity-verified delivery (age-restricted goods)

**Scenario:** You are shipping age-restricted goods (e.g. alcohol, medication) and need to verify the recipient's identity on delivery.

### Flow

```
[createShipmentUnit]
        │
[createPrintingOptions]
        │
[createIdentShipment]
        │ GLS_CREATE_PARCELS_RESPONSE
```

### Example

```
createIdentShipment(
  birthDate: "1990-05-15",
  firstName: "Hans",
  lastName: "Mueller",
  nationality: "DE",
  shipment: {
    Product: "PARCEL",
    Consignee: {
      Address: {
        Name1: "Hans Mueller",
        CountryCode: "DE",
        City: "Munich",
        Street: "Maximilianstrasse",
        ZIPCode: "80333"
      }
    },
    Shipper: {},
    ShipmentUnit: [{ Weight: 1.8 }]
  },
  printingOptions: {
    ReturnLabels: {
      TemplateSet: "NONE",
      LabelFormat: "PDF"
    }
  }
)
```

The GLS driver will verify the recipient's ID against the provided name, birthdate, and nationality before handing over the parcel.

---

## Use Case 5: End-of-day reconciliation

**Scenario:** At the end of each business day, you want to fetch all shipments dispatched that day and reconcile them with your order management system.

### Flow

```
[getEndOfDayReport({ date: "2025-01-15" })]
        │ GLS_END_OF_DAY_RESPONSE_DATA
        │
[for each Shipment in response]
        │
[match TrackID to order / update status]
```

### Example

```
getEndOfDayReport({
  date: "2025-01-15"
})
→ GLS_END_OF_DAY_RESPONSE_DATA
```

Response:
```json
{
  "Shipments": [
    {
      "ShippingDate": "2025-01-15",
      "Product": "PARCEL",
      "Consignee": {
        "Address": { "Name1": "Jane Smith", "City": "Hamburg" } // ... and other parameters
      },
      "ShipmentUnit": [
        { "TrackID": "12345678", "Weight": "1.2", "ParcelNumber": "00123456789" }
      ]
    }
  ]
}
```

---

## Use Case 6: Reprint a lost label

**Scenario:** A shipping label was damaged in your warehouse. You need to reprint it before the parcel is picked up.

### Flow

```
[reprintParcel({ TrackID, CreationDate, PrintingOptions })]
        │ GLS_REPRINT_PARCEL_RESPONSE_DATA
        │
[decode PrintData and send to printer]
```

### Example

```
reprintParcel({
  TrackID: "12345678",
  CreationDate: "2025-01-15",
  PrintingOptions: {
    ReturnLabels: {
      TemplateSet: "NONE",
      LabelFormat: "PDF"
    }
  }
})
→ GLS_REPRINT_PARCEL_RESPONSE_DATA
```

---

## Use Case 7: Check available services for a route

**Scenario:** Before creating a shipment, you want to check which GLS services are available between your depot (Berlin, DE) and a customer in France (Paris, 75001).

### Flow

```
[getAllowedServices({ Source, Destination })]
        │ GLS_ALLOWED_SERVICES_RESPONSE_DATA
        │
[filter AllowedServices list / present to user or use in logic]
```

### Example

```
getAllowedServices({
  Source: {
    CountryCode: "DE",
    ZIPCode: "10115"
  },
  Destination: {
    CountryCode: "FR",
    ZIPCode: "75001"
  }
})
→ GLS_ALLOWED_SERVICES_RESPONSE_DATA
```

Response:
```json
{
  "AllowedServices": [
    { "ProductName": "PARCEL" },
    { "ServiceName": "FlexDeliveryService" },
    { "ServiceName": "SignatureService" }
  ]
}
```

Use this to dynamically enable/disable delivery options in your checkout flow.

---

## Use Case 8: Saturday express delivery

**Scenario:** A customer orders on Friday and wants to receive their parcel on Saturday.

> **Important:** Saturday delivery requires `Product: "EXPRESS"`. Using `"PARCEL"` will throw an error.

### Flow

```
[createShipmentUnit]
        │
[createPrintingOptions]
        │
[createDeliverySaturdayShipment]
        │ GLS_CREATE_PARCELS_RESPONSE
```

### Example

```
createDeliverySaturdayShipment(
  shipment: {
    Product: "EXPRESS",   ← required!
    Consignee: {
      Address: {
        Name1: "Weekend Shopper",
        CountryCode: "DE",
        City: "Cologne",
        Street: "Schildergasse",
        ZIPCode: "50667"
      }
    },
    Shipper: {},
    ShipmentUnit: [{ Weight: 0.8 }]
  },
  printingOptions: {
    ReturnLabels: {
      TemplateSet: "NONE",
      LabelFormat: "PDF"
    }
  }
)
```
