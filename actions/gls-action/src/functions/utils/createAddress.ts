import {ActionSdk} from "@code0-tech/hercules";
import {AddressSchema} from "../../types/glsAddress";

export default (sdk: ActionSdk) => {
    return sdk.registerFunctionDefinitions(
        {
            definition: {
                runtimeName: "createAddress",
                documentation: [
                    {
                        code: "en-US",
                        content: "Creates a GLS address object (`GLS_ADDRESS`) for use in shipments as consignee, shipper, or return address."
                    }
                ],
                displayMessage: [
                    {
                        code: "en-US",
                        content: "Create address"
                    }
                ],
                signature: "(Name1: string, CountryCode: string, City: string, Street: string, ZIPCode: string, Name2?: string, Name3?: string, Province?: string, StreetNumber?: string, ContactPerson?: string, FixedLinePhonenumber?: string, MobilePhonenumber?: string, Email?: string): GLS_ADDRESS",
                name: [
                    {
                        code: "en-US",
                        content: "Create address",
                    }
                ],
                description: [
                    {
                        code: "en-US",
                        content: "Creates a GLS address object which can be used for shipments.",
                    }
                ],
                parameters: [
                    {
                        runtimeName: "Name1",
                        name: [
                            {
                                code: "en-US",
                                content: "Name 1",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The name of the recipient or company. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "CountryCode",
                        name: [
                            {
                                code: "en-US",
                                content: "Country code",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The ISO alpha-2 country code. For example, DE for Germany or FR for France.",
                            }
                        ]
                    },
                    {
                        runtimeName: "City",
                        name: [
                            {
                                code: "en-US",
                                content: "City",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The city of the address. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "Street",
                        name: [
                            {
                                code: "en-US",
                                content: "Street",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The street name of the address. Min length is 4 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "ZIPCode",
                        name: [
                            {
                                code: "en-US",
                                content: "ZIP code",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The ZIP code of the address. Max length is 10 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "Name2",
                        name: [
                            {
                                code: "en-US",
                                content: "Name 2",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "Additional name information. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "Name3",
                        name: [
                            {
                                code: "en-US",
                                content: "Name 3",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "Additional name information. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "Province",
                        name: [
                            {
                                code: "en-US",
                                content: "Province/State",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The province or state of the address. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "StreetNumber",
                        name: [
                            {
                                code: "en-US",
                                content: "Street number",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The street number of the address. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "ContactPerson",
                        name: [
                            {
                                code: "en-US",
                                content: "Contact person",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The contact person for the address. Max length is 40 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "FixedLinePhonenumber",
                        name: [
                            {
                                code: "en-US",
                                content: "Fixed line phone number",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The fixed line phone number for the address. Max length is 35 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "MobilePhonenumber",
                        name: [
                            {
                                code: "en-US",
                                content: "Mobile phone number",
                            },
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The mobile phone number for the address. Max length is 35 characters.",
                            }
                        ]
                    },
                    {
                        runtimeName: "Email",
                        name: [
                            {
                                code: "en-US",
                                content: "Email",
                            }
                        ],
                        description: [
                            {
                                code: "en-US",
                                content: "The email address for the address. Max length is 80 characters.",
                            }
                        ]
                    }
                ],
                linkedDataTypes: [
                    "GLS_ADDRESS",
                ]
            },
            handler: (
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
            ): AddressSchema => {
                return {
                    Name1,
                    Name2,
                    Name3,
                    CountryCode,
                    Province,
                    City,
                    Street,
                    StreetNumber,
                    ContactPerson,
                    FixedLinePhonenumber,
                    MobilePhonenumber,
                    eMail: Email,
                    ZIPCode
                }
            }
        }
    )
}
