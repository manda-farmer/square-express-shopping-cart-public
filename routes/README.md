# Routes Directory

Routes contains the [ExpressJs routes](https://expressjs.com/en/guide/routing.html) used to match the the requests the server receives.

## index.js

The base script for the backend. It contains two routes, which are the main ways to obtain necessary information for the rest of the application. 

The first route sends an array of all catalog items and variations, paired with their corresponding image objects, and available locationId(s).

create-order takes three pieces of data from a POST request: itemVarId, itemQuantity, and locationId. It then returns the full order object, which includes orderId.

## cart.js

This file matches any requests with `./cart/*` in the base of the relative path of the url.

The routes in here contain the necessary functions for manipulating an order, prior to fullfillment details and payment capture. 

## checkout.js

This file matches any requests with `./checkout/*` in the base of the relative path of the url.

The `add-delivery-details` route populates the fulfillment details with type "SHIPMENT" and necessary address information.

The `payment` route takes the nonce generated from a payment form, with corresponding orderId and captures payment. 

The `create-invoice` route creates an invoice from the orderId. The created invoice is not published.