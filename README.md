# Headless Express Server Powered by Square's NodeJS SDK

  - [Setup](#setup)
  - [Project organization](#project-organization)
  - [Application flow](#application-flow)

This is a backend server that makes use of the latest [Square NodeJS SDK](https://github.com/square/square-nodejs-sdk).
It is essentially a headless version of the [Order-Ahead Sample App](https://github.com/square/connect-api-examples/blob/master/connect-examples/v2/node_orders-payments) that
has been updated to use ES6 imports. For backwards compatibility, the
esm module has been added as a require when starting node. If you are
using [NodeJS v15.3.0 =<](https://nodejs.org/docs/latest-v15.x/api/esm.html), then you can remove
this dependency from your package lock and package.json files, including 
the `-r ems` in the start and test scripts. 
The application uses the following Square APIs for synchronicity, and in lieu of a back-end database:

*   [Orders API](https://developer.squareup.com/reference/square/orders-api) to manage orders.
*   [Payments API](https://developer.squareup.com/reference/square/payments-api) to process payments.
    The application also uses the Square-provided JavaScript library to include a payment form.
*   [Catalog API](https://developer.squareup.com/reference/square/catalog-api) to manage the catalog of food items you sell.
    Square provide a script for you to prepopulate catalog items, variations, categories, and taxes.

After processing payment, the seller can then fulfill the order. The seller can view paid orders on the Seller Dashboard
or receive order information on the Square Point of Sale mobile app (after processing the payment, Square sends the order
details to Square Point of Sale.) For more information, see [Square Point of Sale](https://squareup.com/us/en/point-of-sale). 

Before you begin, note the following:

* **Application framework.** This sample uses [Express](https://expressjs.com/) (a web framework for Node.js).
* **Sandbox testing.** Application configuration allows you to test the application both in the Square Sandbox
and in the production environment. For testing, the Sandbox is great because you do not charge your real credit card.
Instead, you use a fake card that Square provides for the Sandbox environment.
* **Production ready?** This application is not currently production-ready. Only use it in Sandbox.

## Setup

1. Set your credentials. 

    Create a copy of the `.env.example` file in the root directory of this example and name it `.env`.

    Replace the placeholders with your own production and/or sandbox credentials. 
    For more help, see Square's [guide on how to get your credentials](https://developer.squareup.com/docs/orders-api/quick-start/step-1).

    **WARNING**: Remember to use your own credentials only for testing the sample app.
    If you plan to make a version of this sample app available for your own purposes,
    use the Square [OAuth API](https://developer.squareup.com/docs/oauth-api/what-it-does)
    to safely manage access to Square accounts. 

1. Open your terminal and install the sample application's dependencies with the command:
    ```
    npm install --save
    ```
    or, if you prefer yarn, there is an included yarn.lock file
    ```
    yarn install
    ```

1. Test the app.

    Run the server with your production credentials
    **NOT RECOMMENDED**:
    ```
    npm start
    ```
    Run the server with your sandbox credentials:
    ```
    npm test
    ```

1. Open `localhost:3001` in your browser. If your account has catalog items with images, the
app will provide you with a remote URL that they can be accessed from, allowing you to incorporate
all of the response data into a front end out-of-the-box.

1. [Optional] Square also provides a script you can use to quickly populate your sandbox store's catalog
with test items. Run the script and then fetch the catalog with cURL to confirm:

    ```
    npm run seed; curl http://localhost:3001
    ```

## Project organization

This Express.js project is organized as follows:

* **/models**. JavaScript classes in these files are used to abstract data coming from Square APIs.
      Currently only contains two scripts: one for obtaining individual catalog items, and another for
      generating a list of catalog items, with their corresponding image objects.
* **/routes.** The following JavaScript files define the routes to handle requests:
    * **index.js.** Provides routes to provide the necessary components for intiating the application
      flow - catalog items for creating an order, and an order_id for manipulating the order prior to
      checkout.
    * **cart.js.** Provides routes to handle all the requests related to order manipulation, prior to
      SHIPMENT fulfillment details, and payment capture.
    * **checkout.js.** Provides routes to handle all the requests related to the checkout flow.
* **/util.** The code initializes the Square SDK client and exports each of Square API clients.

## Application flow

The application flow primarily explains Square API integration with this application, with the
assumption that you are familiar with [Express](https://expressjs.com/) (the web framework for Node.js.)
Each step in the flow is accompanied by a pratical example.

1. Initially the `router.get("/", …) `controller (in [index.js](routes/index.js#L32)) executes and returns
the full catalog via [catalog-list.js](models/catalog-list.js), and locationId(s) from
`const { result: { locations } } = await locationsApi.listLocations();`.

    The controller makes the following Square API calls:

    * `listCatalog` (Catalog API) to retrieve a list of catalog items. 
    * `listLocations `(Locations API) to get a list of seller locations. The application lists all
      available locationIds(s) in the response. You need a locationId to create an order but no
      other pieces of the location object. The catalog objects from `listCatalog` are then fed 
      into `CatalogList()` from the catalog-list.js model. 

    Let's try it out! Send a cURL request to the application's URL, `http://localhost:3001`: 
    ```
    curl http://localhost:3001
    ```
    To better illustrate the flow, we will be working with the following catalog item object for the
duration of this document. 
    ```
    {
        "locationId":"LT2DV63WPWFKK",
        {
            items:[{
            "catalogItemObj": {
                "type": "ITEM",
                "id": "TXB7HUAVX5TW5MQQMD7D7KYJ",
                "updatedAt": "2020-12-10T23:53:11.24Z",
                "version": 1607644391240,
                "isDeleted": false,
                "presentAtAllLocations": true,
                "imageId": "6N75E7RT4GO5QVDOSRP6TY7O",
                "itemData": {
                "name": "Mediterranean Yogurt Bowl",
                "description": "Greek yogurt topped with olives, chopped peppers, cucumber, crispy chickpeas, beans, and figs. Served with our fresh homemade pita.",
                "abbreviation": "MYB",
                "categoryId": "ZCZPXDGBV6ZU6UET6G3C3MWM",
                "taxIds": [
                    "GJXK6V73DJPP2HKAJVJZ6RYX"
                ],
                "variations": [
                    {
                    "type": "ITEM_VARIATION",
                    "id": "YCUUZCAUZIPBQFZHF6YOZNEK",
                    "updatedAt": "2020-12-10T23:53:05.054Z",
                    "version": 1607644385054,
                    "isDeleted": false,
                    "presentAtAllLocations": true,
                    "itemVariationData": {
                        "itemId": "TXB7HUAVX5TW5MQQMD7D7KYJ",
                        "name": "Regular",
                        "ordinal": 0,
                        "pricingType": "FIXED_PRICING",
                        "priceMoney": {
                        "amount": 495,
                        "currency": "USD"
                        }
                    }
                    }
                ],
                "productType": "REGULAR"
                }
            },
            "catalogImageObj": {
                "type": "IMAGE",
                "id": "6N75E7RT4GO5QVDOSRP6TY7O",
                "updatedAt": "2020-12-10T23:53:11.24Z",
                "version": 1607644391240,
                "isDeleted": false,
                "presentAtAllLocations": true,
                "imageData": {
                "name": "",
                "url": "https://square-catalog-sandbox.s3.amazonaws.com/files/51206a7b2a18cbb82221199ddf61a5622f141661/original.jpeg",
                "caption": "A picture of a Mediterranean Yogurt Bowl."
                }
            }]
        }
    }
    ```

1. Equipped with the full list of catalog objects and available locationId(s), the next step in the
process can be performed, which is creating an order. The `router.post("/create-order", ...)`
controller (in [index.js](routes/index.js#68)) takes the following POST data for the request body (`req.body`),
and populates `orderRequestBody` the appropriate fields, generating a unique idemptoencyKey with randomBytes. 
The contents of `orderRequestBody` are then sent to Square via the NodeJS SDK's [ordersApi.createOrder](routes/index.js#85) function,
and the controller [responds with the full order object](routes/index.js#86).

    ```
    itemVarId,
    itemQuantity,
    locationId
    ```

    The controller makes the following Square API call:
    * `createOrder`(Orders API) creates the order

    Now we can create our own order with the example above, using the /create-order controller.
    Take note of the following:
    * **No dashboard** Orders are ONLY visible through the app that you are running, until payment has been captured AND fulfillment
details have been added. Until both of these requirements are met, you will not be able to view the order in your
sandbox dashboard
    * **IDs are placeholders** Each ID that Square provides is unique across the entire ecosystem. The examples I am giving will NOT work in your
    application, so be sure to replace the example values with IDs from your application.

    With that in mind, let's create an order by sending a POST request to the server with itemVarId, an itemQuantity, and locationId:

    ```
    curl -X POST http://localhost:3001/create-order \
    -d "itemVarId=YCUUZCAUZIPBQFZHF6YOZNEK&\
    itemQuantity=1&\
    locationId=LT2DV63WPWFKK"
    ```

    If everything goes according to plan, you should be rewarded with an order object:

    ```
    {
    "result": "Success! Order created!",
    "order": {
        "id": "lpAKu16lRYVyLiofFWzXH8MvKwMZY",
        "locationId": "LT2DV63WPWFKK",
        "source": {
        "name": "Sandbox for square-express-shopping-cart"
        },
        "lineItems": [
        {
            "uid": "bs7ikzCZvWceKY4mx6b1FB",
            "name": "Mediterranean Yogurt Bowl",
            "quantity": "1",
            "catalogObjectId": "YCUUZCAUZIPBQFZHF6YOZNEK",
            "variationName": "Regular",
            "basePriceMoney": {
            "amount": 495,
            "currency": "USD"
            },
            "variationTotalPriceMoney": {
            "amount": 495,
            "currency": "USD"
            },
            "grossSalesMoney": {
            "amount": 495,
            "currency": "USD"
            },
            "totalTaxMoney": {
            "amount": 0,
            "currency": "USD"
            },
            "totalDiscountMoney": {
            "amount": 0,
            "currency": "USD"
            },
            "totalMoney": {
            "amount": 495,
            "currency": "USD"
            }
        }
        ],
        "netAmounts": {
        "totalMoney": {
            "amount": 495,
            "currency": "USD"
        },
        "taxMoney": {
            "amount": 0,
            "currency": "USD"
        },
        "discountMoney": {
            "amount": 0,
            "currency": "USD"
        },
        "tipMoney": {
            "amount": 0,
            "currency": "USD"
        },
        "serviceChargeMoney": {
            "amount": 0,
            "currency": "USD"
        }
        },
        "createdAt": "2021-02-06T22:07:43.353Z",
        "updatedAt": "2021-02-06T22:07:43.353Z",
        "state": "OPEN",
        "version": 1,
        "totalMoney": {
        "amount": 495,
        "currency": "USD"
        },
        "totalTaxMoney": {
        "amount": 0,
        "currency": "USD"
        },
        "totalDiscountMoney": {
        "amount": 0,
        "currency": "USD"
        },
        "totalTipMoney": {
        "amount": 0,
        "currency": "USD"
        },
        "totalServiceChargeMoney": {
        "amount": 0,
        "currency": "USD"
        }
    }
    }
    ```
    Take note of the tax amount - $0. Even though this object has a tax rate of 8.5%, tax is not calculated by
the Square API.
    * **TO DO** Add tax calculation to the checkout flow. For some reason, when it is done on [/create-order](routes/index.js#68),
    all child lineItems have the same tax applied.