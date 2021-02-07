/*
Copyright 2021 Square Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import express from 'express';

import { randomBytes } from 'crypto';
import { ordersApi, paymentsApi } from '../util/square-client';

const router = express.Router();

/**
 * Matches: POST /checkout/add-delivery-details/
 *
 * Description:
 *  Take the delivery infomration that are submitted from the page,
 *  then call UpdateOrder api to update the fulfillment.
 *
 *  You learn more about the UpdateOrder endpoint here:
 *  https://developer.squareup.com/reference/square/orders-api/update-order
 *
 *  NOTE: This example is to show you how to update an order, however, you don't
 *  have to create an order and update it in each step; Instead, you can also
 *  collect all the order information that include purchased catalog items and
 *  fulfillment inforamiton, and create an order all together.
 *
 * Request Body:
 *  orderId: Id of the order to be updated
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 *  deliveryName: Name of the individual who will receive the delivery
 *  deliveryEmail: Email of the recipient
 *  deliveryNumber: Phone number of the recipient
 *  deliveryTime: Expected delivery time
 *  deliveryAddress: Street address of the recipient
 *  deliveryCity: City of the recipient
 *  deliveryState: State of the recipient
 *  deliveryPostal: Postal code of the recipient
 */
router.post("/add-delivery-details", async (req, res, next) => {
  const {
    orderId,
    locationId,
    deliveryName,
    deliveryEmail,
    deliveryNumber,
    deliveryAddress,
    deliveryCity,
    deliveryState,
    deliveryPostal,
    version
  } = req.body;
  try {
    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId,
        fulfillments: [{
          type: "SHIPMENT", // SHIPMENT type is determined by the endpoint
          state: "PROPOSED",
          shipmentDetails: {
            recipient: {
              displayName: deliveryName,
              phoneNumber: deliveryNumber,
              email: deliveryEmail,
              address: {
                addressLine1: deliveryAddress,
                administrativeDistrictLevel1: deliveryState,
                locality: deliveryCity,
                postalCode: deliveryPostal,
              },
            },
            expectedShippedAt: deliveryTime,
          },
        },],
        version,
        idempotencyKey,
      },
    };
    const { result: { order } } = await ordersApi.updateOrder(`${orderId}`,orderRequestBody);
    res.send(
      {
          result: "Success! Delivery details added!",
          order: order
        })
  } catch (error) {
    next(error);
  }
});


/**
 * Matches: POST /checkout/payment/
 *
 * Description:
 *  Take the payment infomration that are submitted from the /checkout/payment page,
 *  then call payment api to pay the order
 *
 *  You learn more about the CreatePayment endpoint here:
 *  https://developer.squareup.com/reference/square/payments-api/create-payment
 *
 * Request Body:
 *  orderId: Id of the order to be updated
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 *  nonce: Card nonce (a secure single use token) created by the Square Payment Form
 */
router.post("/payment", async (req, res, next) => {
  const {
    orderId,
    nonce
  } = req.body;
  try {
    // get the latest order information in case the price is changed from a different session
    const { result: { order } } = await ordersApi.retrieveOrder(orderId);
    if (order.totalMoney.amount > 0) {
      // Payment can only be made when order amount is greater than 0
      await paymentsApi.createPayment({
        sourceId: nonce, // Card nonce created by the payment form
        idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
        amountMoney: order.totalMoney, // Provides total amount of money and currency to charge for the order.
        orderId: order.id, // Order that is associated with the payment
      });
    } else {
      // Settle an order with a total of 0.
      await ordersApi.payOrder(order.id, {
        idempotencyKey
      });
    }
    res.send(
      {
          result: "Success! Order paid!",
          order: order
        })
  } catch (error) {
    next(error);
  }
});

export default router;
