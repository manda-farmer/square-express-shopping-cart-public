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
import { catalogApi, locationsApi, ordersApi } from '../util/square-client';
import CatalogList from '../models/catalog-list';

const router = express.Router();

/**
 * Matches: GET /
 *
 * Description:
 *  Retrieves list of locations and CatalogItems, then renders views/index.pug template.
 *  Note: In this example we only use the first location in the list.
 */
router.get("/", async (req, res, next) => {
  // Set to retrieve ITEM and IMAGE CatalogObjects
  const types = "ITEM,IMAGE"; // To retrieve TAX or CATEGORY objects add them to types

  try {
    // Retrieves locations in order to display the store name
    const { result: { locations } } = await locationsApi.listLocations();
    // Get CatalogItem and CatalogImage object
    const { result: { objects } } = await catalogApi.listCatalog(undefined, types);
    // Returns the catalog and location ID, since we don't need to
    // print the full locationInfo array
    res.send({
      locationId: locations.id,
      items: new CatalogList(objects).items
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Matches: POST /create-order
 *
 * Description:
 *  Creates an order by taking lineItems, an array of quantities and itemVarIds. 
 *  Learn more about Orders here: https://developer.squareup.com/docs/orders-api/what-it-does
 *
 *  Once the order has been successfully created, the order's information is
 *  returned with res.send({}). This allows for shopping cart data that is 
 *  pre-sync'd with Square's API, and updates in real-time.
 * 
 * Request Body:
 *  itemVarId: Id of the CatalogItem which will be purchased
 *  itemQuantity: Quantility of the item
 *  locationId: The Id of the location
 */
router.post("/create-order", async (req, res, next) => {
  const {
    itemVarId,
    itemQuantity,
    locationId
  } = req.body;
  try {
    const orderRequestBody = {
      idempotencyKey: randomBytes(45).toString("hex"), // Unique identifier for request
      order: {
        locationId,
        lineItems: [{
          quantity: itemQuantity,
          catalogObjectId: itemVarId // Id for CatalogItem object
        }]
      }
    };
    const { result: { order } } = await ordersApi.createOrder(orderRequestBody);
    res.send(
      {
        result: "Success! Order created!",
        order: order
      })
  } catch (error) {
    next(error);
  }
});

export default router;