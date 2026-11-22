import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: key => memory.delete(key),
};
const source = readFileSync(new URL('../js/browser-demo.js', import.meta.url), 'utf8');
const { browserDemoRequest: request, resetBrowserDemo } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
const customer = 'browser-demo:customer', staff = 'browser-demo:staff';
const call = (method, path, options = {}) => request(method, path, options);

test('browser demo completes customer purchase and staff fulfillment in one browser', async () => {
  resetBrowserDemo();
  const login = await call('POST', '/auth/login', { body: { username: 'customer', password: 'Customer@1234' } });
  assert.equal(login.data.token, customer);
  const before = (await call('GET', '/products/1')).data.stock_quantity;
  await call('POST', '/cart/items', { token: customer, body: { product_id: 1, quantity: 2 } });
  const selection = { product_ids: [1], address_id: 1, shipping_method: 'standard', payment_method: 'promptpay' };
  const quote = (await call('POST', '/orders/quotes', { token: customer, body: selection })).data;
  assert.equal(quote.items[0].quantity, 2);
  const paid = await call('POST', '/orders', { token: customer, body: {
    ...selection, quote_hash: quote.quote_hash, checkout_key: 'demo-test-1', simulation_result: 'succeeded',
  } });
  const id = paid.data.order_id;
  assert.equal((await call('GET', '/cart', { token: customer })).data.items.length, 0);
  assert.equal((await call('GET', '/products/1')).data.stock_quantity, before - 2);
  assert.equal((await call('GET', '/orders', { token: customer })).data[0].order_id, id);
  assert.equal((await call('GET', '/admin/orders', { token: staff })).data[0].order_id, id);
  const advance = async (status, fields = {}) => {
    const order = (await call('GET', `/admin/orders/${id}`, { token: staff })).data;
    return (await call('PATCH', `/admin/orders/${id}/fulfillment`, { token: staff, body: {
      expected_status: order.current_status, expected_version: order.fulfillment_version, status, ...fields,
    } })).data;
  };
  await advance('packing');
  await advance('shipped', { carrier: 'Demo Express', tracking_no: 'TEST123' });
  await advance('delivered');
  const completed = (await call('POST', `/orders/${id}/receipt`, { token: customer })).data;
  assert.equal(completed.current_status, 'completed');
  assert.deepEqual(completed.status_history.map(row => row.to_status),
    ['paid', 'packing', 'shipped', 'delivered', 'completed']);
});

test('failed simulated payment does not create an order or deduct stock', async () => {
  resetBrowserDemo();
  await call('POST', '/cart/items', { token: customer, body: { product_id: 2, quantity: 1 } });
  const selection = { product_ids: [2], address_id: 1, shipping_method: 'standard', payment_method: 'truemoney' };
  const quote = (await call('POST', '/orders/quotes', { token: customer, body: selection })).data;
  await assert.rejects(call('POST', '/orders', { token: customer, body: {
    ...selection, quote_hash: quote.quote_hash, checkout_key: 'demo-test-2', simulation_result: 'failed',
  } }), { code: 'PAYMENT_SIMULATED_FAILED' });
  assert.equal((await call('GET', '/products/2')).data.stock_quantity, 10);
  assert.equal((await call('GET', '/orders', { token: customer })).data.length, 0);
});

test('demo blocks staff order access for customer', async () => {
  await assert.rejects(call('GET', '/admin/orders', { token: customer }), { status: 403 });
});
