import JSONBig from 'json-bigint';
import { randomBytes } from 'crypto';
import { ordersApi, invoicesApi, paymentsApi } from '../util/square-client';

export class Cart {
  constructor(orderId, orderRequestBody) {
    this.orderId = orderId;
    this.orderRequestBody = orderRequestBody;
  }

  create = async () => {
  	const { result: order } = await ordersApi.createOrder(this.orderRequestBody);
  	const orderParsed = JSONBig.parse(JSONBig.stringify(order));
 	return orderParsed
  }

  update = async () => {
  	const { result: order } = await ordersApi.updateOrder(`${this.orderId}`, this.orderRequestBody);
 	const orderParsed = JSONBig.parse(JSONBig.stringify(order));
 	return orderParsed
  }

  info = async () => {
  	const { result: { order } } = await ordersApi.retrieveOrder(`${this.orderId}`);
    const orderParsed = JSONBig.parse(JSONBig.stringify(order));
    return orderParsed
  }

  invoiceCreate = async () => {
  	const { result: { order } } = ordersApi.retrieveOrder(`${this.orderId}`);
  	const { result: { invoice } } = await invoicesApi.createInvoice(orderRequestBody);
    const invoiceParsed = JSONBig.parse(JSONBig.stringify(invoice));
    return invoiceParsed
  }

}