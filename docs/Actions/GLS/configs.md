---
title: Action Configuration
---

The GLS action provides following configurations:

| Config Name     | Description                                                      | Type        | Required |
|-----------------|------------------------------------------------------------------|-------------|----------|
| contact_id      | The contact id used in some requests                             | string      | No       |
| client_id       | The client id used for auth purposes                             | string      | Yes      |
| client_secret   | The client secret used for auth purposes                         | string      | Yes      |
| ship_it_api_url | Gls provides multiple ship it urls, provide yours                | string      | No       |
| auth_url        | Gls provides multiple auth urls, provide yours ending in /token  | string      | No       |
| shipper         | And default shipper which is replaced in the request if provided | GLS_SHIPPER | No       |


For you to receive that credentials you need to follow this guide: https://dev-portal.gls-group.net/get-started#sign-in 

You can receive the client id and secret under "My Apps" after creating one.

The Contact id needs to be retrieved from GLS support, so you need to contact them and ask for it.