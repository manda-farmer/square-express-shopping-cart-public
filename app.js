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

import path from 'path';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import JSONBig from 'json-bigint';
import cors from 'cors';
import router from './routes/index';
import cart from './routes/cart';
import checkout from './routes/checkout';
// Node creates cached instance of square-client, on initial load
import './util/square-client';

const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());
app.set('json spaces', 2);
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, ".well-known")));
app.use(cors({origin: 'http://localhost:3000'}));
app.use("/", router);
app.use("/cart", cart);
app.use("/checkout", checkout);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers
// For simplicity, we print all error information
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.status(500).send({
    status: err.status,
    message: err.message,
    // If it is a response error then format the JSON string, if not output the error
    error: err.errors ? JSON.stringify(JSONBig.parse(JSONBig.stringify(err.errors, null, 4))) : err.stack
  });
});

export default app;
