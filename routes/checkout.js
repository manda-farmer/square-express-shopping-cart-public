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
import JSONBig from 'json-bigint';

import { randomBytes } from 'crypto';
import { Cart } from '../models/cart';
import { ordersApi, invoicesApi, paymentsApi } from '../util/square-client';

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
    const orderParsed = JSONBig.parse(JSONBig.stringify(order));
    res.json(
      {
          result: "Success! Delivery details added!",
          order: orderParsed
        })
  } catch (error) {
    next(error);
  }
});

/**
 * Matches: POST /checkout/create-invoice
 * 
 * Description:
 *   Create an invoice if the customer opts to pay later. This also allows
 *   for in-person payment capture via Square mobile app at the time of
 *   delivery, resulting in a lower fee. This method only creates the 
 *   invoice, it does not publish it yet. This allows for fully synchronous
 *   order confirmation with Square.
 * 
 *   You can learn more about the CreateInvoice endpoint here:
 *   https://developer.squareup.com/reference/square/invoices-api/create-invoice
 *
 * Request Body:
 *  orderId: Id of the order to create an invoice from
 *  locationId: Id of the location that the order belongs to
 *  idempotencyKey: Unique identifier for request from client
 */
router.post("/create-invoice", async (req, res, next) => {
  const {
    orderId
  } = req.body;
  
  function nextWeekdayDate(date, day_in_week) {
    const ret = new Date(date || new Date());
    ret.setDate(ret.getDate() + (day_in_week -1 - ret.getDay() + 7) % 7 + 1);
  return ret;
  }
  
  try {
    // Since deliveries happen every Tuesday, set the dueDate
    // to Tuesday using nextWeekdayDate()
    const date = new Date();
    // Set due date to next Tuesday
    const dueDate = new nextWeekdayDate(date, 2);
    const dueDateString = dueDate.toISOString().split("T")[0];
    let { result: { order } } = await ordersApi.retrieveOrder(orderId);
    const orderRequestBody = {
      invoice: {
        locationId: order.locationId,
        orderId: orderId,
        paymentRequests: [
        {
          requestType: 'BALANCE',
          //dueDate: order.expectedShippedAt,
          dueDate: dueDateString,
          reminders: [
          {
            message: 'Your order is scheduled for tomorrow',
            relativeScheduledDays: -1
          }]
        }],
        deliveryMethod: 'SHARE_MANUALLY',
        idempotencyKey: randomBytes(45).toString("hex")
      }
    };
    const { result: { invoice } } = await invoicesApi.createInvoice(orderRequestBody);
    const invoiceParsed = JSONBig.parse(JSONBig.stringify(invoice));
    //const orderParsed = JSONBig.parse(JSONBig.stringify(order));
    const cart = new Cart(orderId);
    order = await cart.info();
    res.json(
      {
          result: "Success! Invoice created!",
          invoice: JSONBig.parse(JSONBig.stringify(invoice)),
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
 *  You can learn more about the CreatePayment endpoint here:
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
    idempotencyKey,
    nonce
  } = req.body;
  try {
    // get the latest order information in case the price is changed from a different session
    const { result: { order } } = await ordersApi.retrieveOrder(orderId);
    if (order.totalMoney.amount > 0) {
      // Payment can only be made when order amount is greater than 0
      const orderRequestBody = {
        sourceId: nonce, // Card nonce created by the payment form
        idempotencyKey,
        amountMoney: order.totalMoney, // Provides total amount of money and currency to charge for the order.
        orderId: order.id, // Order that is associated with the payment
      };
    } else {
      // Settle an order with a total of 0.
      await ordersApi.payOrder(order.id, {
        idempotencyKey
      });
    }
    const { result: { payment } } = await paymentsApi.createPayment(orderRequestBody);
    const paymentParsed = JSONBig.parse(JSONBig.stringify(payment));
    res.json(
      {
          result: "Success! Order paid!",
          payment: paymentParsed
        })
  } catch (error) {
    next(error);
  }
});

export default router;
