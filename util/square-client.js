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

import { Client, ApiError } from 'square';
import 'dotenv/config';

const env = process.env.NODE_ENV;
const accessToken = process.env[`SQUARE_${env.toUpperCase()}_ACCESS_TOKEN`]
const squareApplicationId = process.env[`SQUARE_${env.toUpperCase()}_APPLICATION_ID`]

// Set Square credentials
const config = { accessToken, environment:env }

// Extract instances of Api that are used
// You can add additional APIs here if you so choose
export const {
  catalogApi,
  locationsApi,
  ordersApi,
  paymentsApi,
  invoicesApi
} = new Client(config)

export default ApiError
