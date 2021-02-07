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
import { ordersApi } from '../util/square-client';

const router = express.Router();

/**
 * Matches: POST /cart/order-info
 *
 * Description:
 *  Responds with information about an order, and only needs an orderId as argument.
 *  This handles potential refresh issues on the front end, and can be used
 *  for order confirmation on the checkout page. It's also useful for abstracting
 *  data to the front-end, and only requires making use of the built-in 
 *  retriveOrder() function from client.ordersApi. 
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the order has been successfully created, the order's information is
 *  returned with res.send({}). This allows for shopping cart data that is 
 *  pre-sync'd with Square's API, and updates in real-time.
 * 
 * Request Body:
 *  orderId: The order's ID, the only component that is required
 */
router.post("/order-info", async (req, res, next) => {
    const {orderId} = req.body;
    try {
      const { result: { order } } = await ordersApi.retrieveOrder(orderId);
      res.send({orderInfo: order});
    } catch (error) {
      next(error);
    }
  });

/**
 * Matches: POST /cart/update-order-add-item
 *
 * Description:
 *  Updates the order by adding a new item. 
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the order has been successfully updated, the order's information is
 *  returned with res.send({}). This allows for shopping cart data that is 
 *  pre-sync'd with Square's API, and updates in real-time.
 * 
 * Request Body:
 *  itemVarId: Id of the CatalogItem which will be purchased
 *  itemQuantity: Quantility of the item
 *  locationId: The Id of the location
 */
router.post("/update-order-add-item", async (req, res, next) => {
  const {
    orderId,
    itemVarId,
    itemQuantity,
    locationId,
    version
  } = req.body;
  try {
    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId,
        lineItems: [{
          quantity: itemQuantity,
          catalogObjectId: itemVarId // ID for CatalogItem object
        }],
        version
      }
    };
    const { result: { order } } = await ordersApi.updateOrder(`${orderId}`,orderRequestBody);
    res.send(
      {
          result: "Success! Order updated!",
          order: order
        })
  } catch (error) {
    next(error);
  }
});


/**
 * Matches: POST /cart/update-order-item-quantity
 *
 * Description:
 *  Updates the quantity/quantities of an item(s) that is/are already in the cart.
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the item quantity has been successfully modified, the updated order's 
 *  information is returned with res.send({updatedOrder}). Items are not fully 
 *  removed by setting itemQuantity to 0. While it bears no impact on the order's
 *  total, the item still retains a uid in the cart, in case the customer wants
 *  to re-add another quantity later. This allows for syncronous replication of  
 *  data between Square's API, and the front-end React application.
 * Request Body:
 *  locationId 
 *  orderId
 *  itemId: used for calculating taxes
 *  itemUid: the item's uid
 *  itemQuantity: new total quantity of item
 *  version: the version of the order
 */
router.post("/update-order-item-quantity", async (req, res, next) => {
    const {
      locationId,
      orderId,
      itemUid,
      itemQuantity,
      version
    } = req.body;
    try {
      const orderRequestBody = {
        order: {
          locationId,
          lineItems: [{
            uid: itemUid,  // ID for orderItem object
            quantity: itemQuantity,
          }],
          version,
          idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
        }
      };
      const { result: { order } } = await ordersApi.updateOrder(`${orderId}`,orderRequestBody);
      res.send(  
        {
            result: "Success! Order updated!",
            updatedOrder: order
          })
    } catch (error) {
      next(error);
    }
  });


export default router;