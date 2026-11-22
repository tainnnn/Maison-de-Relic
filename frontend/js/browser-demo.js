// Public portfolio demo. All changes stay in this browser; no network request
// or payment provider is involved. This mirrors the R5 API response shapes so
// the existing pages can be exercised without a server or database.
const KEY = 'mdr_browser_demo_v1';
const categories = [
  { category_id: 1, slug: 'art-toys', name: 'อาร์ตทอย' },
  { category_id: 2, slug: 'trading-cards', name: 'การ์ด' },
  { category_id: 3, slug: 'model-kits', name: 'โมเดล' },
];
const catalog = [
  [1, 'Labubu The Monsters — Exciting Macaron', 1290, 'like_new', 0, 'p-labubu.jpg'],
  [2, 'Charizard Base Set Holo (1999)', 8900, 'excellent', 1, 'p-charizard-base.jpg'],
  [3, 'Mobile Suit Gundam MG 1/100 — Built', 2450, 'excellent', 2, 'p-gundam.jpg'],
  [4, 'Mr. Bone Astronaut Series — Set of 3', 1590, 'new', 0, 'p-mrbone.jpg'],
  [5, 'Pokémon Holo Graded Slabs — Set of 3', 4200, 'like_new', 1, 'p-slab-set.jpg'],
  [6, 'Classic Sports Coupe Diecast 1/43', 1150, 'good', 2, 'p-red-classic.jpg'],
  [7, 'Labubu Mini Figure — Orange Bunny', 650, 'excellent', 0, 'p-orange-bunny.jpg'],
  [8, 'Charizard V Full Art', 1890, 'like_new', 1, 'p-charizard-v.jpg'],
].map(([product_id, title, price, condition, category, image]) => ({
  product_id, title, price, condition, category: categories[category],
  cover_image_url: `/assets/images/${image}`, status: 'available',
  description: `${title} — sample item for the portfolio shopping demo.`,
  attributes: {}, images: [{ url: `/assets/images/${image}`, alt_text: title }],
}));
const address = { address_id: 1, recipient_name: 'Demo Customer', phone: '0812345678',
  line1: '99/9 Demo Road', district: 'Demo District', province: 'Bangkok',
  postcode: '10400', is_default: true };
const users = {
  customer: { user_id: 1, username: 'customer', display_name: 'Demo Customer',
    first_name: 'Demo', last_name: 'Customer', email: 'customer@example.test',
    is_email_verified: true, is_admin: false },
  staff: { user_id: 2, username: 'staff', display_name: 'Demo Staff',
    first_name: 'Demo', last_name: 'Staff', email: 'staff@example.test',
    is_email_verified: true, is_admin: true, admin_role: 'staff' },
};
const passwords = { customer: 'Customer@1234', staff: 'Staff@1234' };
const fail = (status, code, message) => { const error = new Error(message); Object.assign(error, { status, code }); throw error; };
const result = (data, meta) => meta ? { data, meta } : { data };
const initial = () => ({ stock: Object.fromEntries(catalog.map(p => [p.product_id, 10])), cart: [], orders: [], nextOrderId: 1, wishlist: [] });
function read() {
  try { return { ...initial(), ...JSON.parse(localStorage.getItem(KEY) || 'null') }; }
  catch { return initial(); }
}
function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { fail(507, 'DEMO_STORAGE_UNAVAILABLE', 'This browser cannot save demo data. Enable local storage and try again.'); }
}
function userFor(token) {
  const name = typeof token === 'string' && token.startsWith('browser-demo:') ? token.slice(13) : '';
  return users[name] || null;
}
function requireUser(token, staff = false) {
  const user = userFor(token);
  if (!user) fail(401, 'UNAUTHORIZED', 'Please sign in with a demo account.');
  if (staff && !user.is_admin) fail(403, 'FORBIDDEN', 'Staff access is required.');
  return user;
}
function product(state, id) {
  const base = catalog.find(p => p.product_id === Number(id));
  if (!base) fail(404, 'PRODUCT_NOT_FOUND', 'Product not found.');
  const stock_quantity = state.stock[id] ?? 10;
  return { ...base, stock_quantity, in_stock: stock_quantity > 0,
    status: stock_quantity > 0 ? 'available' : 'sold_out' };
}
function cartItems(state) {
  return state.cart.map(line => {
    const p = product(state, line.product_id);
    return { ...p, category_name: p.category.name, quantity: line.quantity,
      available: p.in_stock, quantity_valid: line.quantity <= p.stock_quantity };
  });
}
function quote(state, body) {
  const ids = body?.product_ids;
  if (!Array.isArray(ids) || !ids.length || ids.length > 100) fail(400, 'VALIDATION_ERROR', 'Select at least one product.');
  const items = cartItems(state).filter(p => ids.includes(p.product_id));
  if (items.length !== ids.length || items.some(p => !p.available || !p.quantity_valid)) fail(409, 'OUT_OF_STOCK', 'Check the selected products and stock.');
  if (Number(body.address_id) !== address.address_id) fail(400, 'ADDRESS_NOT_FOUND', 'Choose the demo address.');
  const subtotal = items.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const shipping_fee = body.shipping_method === 'express' ? 80 : subtotal >= 1500 ? 0 : 40;
  const shipping_address = { ship_name: address.recipient_name, ship_phone: address.phone,
    ship_line1: address.line1, ship_district: address.district,
    ship_province: address.province, ship_postcode: address.postcode };
  return { items, subtotal, shipping_fee, grand_total: subtotal + shipping_fee,
    shipping_address, shipping_method: body.shipping_method,
    payment_method: body.payment_method,
    quote_hash: `browser-demo-${ids.join('-')}-${subtotal}-${shipping_fee}` };
}
function listProducts(state, params = {}) {
  let rows = catalog.map(p => product(state, p.product_id));
  if (params.q) rows = rows.filter(p => p.title.toLowerCase().includes(String(params.q).toLowerCase()));
  if (params.category) rows = rows.filter(p => p.category.slug === params.category || String(p.category.category_id) === String(params.category));
  if (params.condition) rows = rows.filter(p => p.condition === params.condition);
  if (params.inStock === 'true') rows = rows.filter(p => p.in_stock);
  if (params.minPrice) rows = rows.filter(p => p.price >= Number(params.minPrice));
  if (params.maxPrice) rows = rows.filter(p => p.price <= Number(params.maxPrice));
  if (params.sort === 'price_asc') rows.sort((a, b) => a.price - b.price);
  if (params.sort === 'price_desc') rows.sort((a, b) => b.price - a.price);
  const page = Math.max(1, Number(params.page) || 1), pageSize = Math.max(1, Number(params.pageSize) || 12);
  return result(rows.slice((page - 1) * pageSize, page * pageSize), { page, pageSize, total: rows.length });
}
function orderList(state, params = {}, staff = false) {
  let rows = state.orders.slice().reverse();
  if (params.status) rows = rows.filter(o => params.status === 'shipping'
    ? ['shipped', 'delivered'].includes(o.current_status) : o.current_status === params.status);
  if (params.order_id) rows = rows.filter(o => String(o.order_id) === String(params.order_id).replace(/^ORD-0*/i, ''));
  if (params.recipient) rows = rows.filter(o => o.shipping_address.ship_name.toLowerCase().includes(String(params.recipient).toLowerCase()));
  if (params.tracking_no) rows = rows.filter(o => (o.tracking_no || '').toLowerCase().includes(String(params.tracking_no).toLowerCase()));
  const page = Math.max(1, Number(params.page) || 1), pageSize = Math.max(1, Number(params.pageSize) || (staff ? 20 : 10));
  return result(rows.slice((page - 1) * pageSize, page * pageSize).map(o => staff
    ? { ...o, ship_name: o.shipping_address.ship_name, item_count: o.items.length }
    : { order_id: o.order_id, current_status: o.current_status, placed_at: o.placed_at,
      grand_total: o.grand_total, shipping_method: o.shipping_method, carrier: o.carrier,
      tracking_no: o.tracking_no, item_count: o.items.length,
      total_quantity: o.items.reduce((sum, item) => sum + item.quantity, 0), first_item: o.items[0] }),
  { page, pageSize, total: rows.length });
}

export async function browserDemoRequest(method, path, { params = {}, body = {}, token } = {}) {
  const state = read();
  if (method === 'GET' && path === '/health') return result({ status: 'ok', db: 'browser', time: new Date().toISOString() });
  if (method === 'POST' && path === '/auth/login') {
    const name = body?.username;
    if (passwords[name] !== body?.password) fail(401, 'INVALID_CREDENTIALS', 'Choose a demo account and use its prefilled password.');
    return result({ token: `browser-demo:${name}`, user: users[name] });
  }
  if (method === 'GET' && path === '/auth/me') return result(requireUser(token));
  if (method === 'GET' && path === '/products') return listProducts(state, params);
  if (method === 'GET' && /^\/products\/\d+$/.test(path)) return result(product(state, path.split('/').pop()));
  if (method === 'GET' && path === '/categories') return result(categories);
  if (method === 'GET' && path === '/series') return result([]);
  if (method === 'GET' && path.startsWith('/recommend/')) return result(catalog.slice(0, Number(params.limit) || 8).map(p => product(state, p.product_id)), { personalized: false });
  if (method === 'GET' && path === '/search/semantic') return listProducts(state, { ...params, pageSize: 12 });
  if (method === 'GET' && /^\/products\/\d+\/reviews$/.test(path)) return result([], { total: 0, page: 1, pageSize: 10 });
  if (method === 'GET' && path === '/addresses') { requireUser(token); return result([address]); }
  if (method === 'GET' && path === '/profile') return result(requireUser(token));
  if (method === 'GET' && path === '/wishlist/ids') { requireUser(token); return result(state.wishlist); }
  if (method === 'GET' && path === '/wishlist') { requireUser(token); return result(state.wishlist.map(id => product(state, id))); }
  if (method === 'POST' && path === '/wishlist') { requireUser(token); if (!state.wishlist.includes(body.product_id)) state.wishlist.push(body.product_id); write(state); return result({ product_id: body.product_id }); }
  if (method === 'DELETE' && /^\/wishlist\/\d+$/.test(path)) { requireUser(token); state.wishlist = state.wishlist.filter(id => id !== Number(path.split('/').pop())); write(state); return null; }
  if (method === 'POST' && path === '/events') return result({ recorded: true });
  if (method === 'GET' && path === '/cart') { requireUser(token); return result({ items: cartItems(state) }); }
  if (method === 'POST' && path === '/cart/items') {
    requireUser(token);
    const id = Number(body.product_id), p = product(state, id), quantity = Number(body.quantity);
    const existing = state.cart.find(item => item.product_id === id);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity + (existing?.quantity || 0) > p.stock_quantity) fail(409, 'OUT_OF_STOCK', 'Not enough stock for this quantity.');
    if (existing) existing.quantity += quantity; else state.cart.push({ product_id: id, quantity });
    write(state); return result({ items: cartItems(state) });
  }
  if (method === 'PATCH' && /^\/cart\/items\/\d+$/.test(path)) {
    requireUser(token);
    const id = Number(path.split('/').pop()), item = state.cart.find(p => p.product_id === id), quantity = Number(body.quantity);
    if (!item) fail(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found.');
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > product(state, id).stock_quantity) fail(409, 'OUT_OF_STOCK', 'Not enough stock for this quantity.');
    item.quantity = quantity; write(state); return result({ items: cartItems(state) });
  }
  if (method === 'DELETE' && /^\/cart\/items\/\d+$/.test(path)) { requireUser(token); state.cart = state.cart.filter(p => p.product_id !== Number(path.split('/').pop())); write(state); return null; }
  if (method === 'POST' && path === '/cart/item-removals') { requireUser(token); state.cart = state.cart.filter(p => !body.product_ids?.includes(p.product_id)); write(state); return result({ items: cartItems(state) }); }
  if (method === 'GET' && path === '/orders/payment-config') { requireUser(token); return result({ mode: 'simulated' }); }
  if (method === 'GET' && path === '/orders/payment-attempts/active') { requireUser(token); return result(null); }
  if (method === 'POST' && path === '/orders/quotes') { requireUser(token); return result(quote(state, body)); }
  if (method === 'POST' && path === '/orders') {
    requireUser(token);
    const existing = state.orders.find(o => o.checkout_key === body.checkout_key);
    if (existing) return result({ order_id: existing.order_id });
    if (body.simulation_result === 'failed') fail(402, 'PAYMENT_SIMULATED_FAILED', 'The simulated payment failed. No order was created.');
    const q = quote(state, body);
    if (body.quote_hash !== q.quote_hash) fail(409, 'QUOTE_CHANGED', 'The total changed. Review the checkout again.');
    const now = new Date().toISOString(), order_id = state.nextOrderId++;
    const order = { ...q, order_id, checkout_key: body.checkout_key, current_status: 'paid',
      placed_at: now, carrier: null, tracking_no: null, fulfillment_version: 1,
      items: q.items.map((p, i) => ({ order_item_id: order_id * 100 + i + 1,
        product_id: p.product_id, title_snapshot: p.title, unit_price_at_purchase: p.price,
        quantity: p.quantity, cover_image_url: p.cover_image_url, category_name: p.category_name })),
      payment: { method: `simulated_${body.payment_method}`, status: 'succeeded',
        amount: q.grand_total, paid_at: now, simulated: true },
      status_history: [{ from_status: null, to_status: 'paid', changed_at: now }] };
    for (const item of q.items) state.stock[item.product_id] -= item.quantity;
    state.cart = state.cart.filter(item => !body.product_ids.includes(item.product_id));
    state.orders.push(order); write(state); return result({ order_id });
  }
  if (method === 'GET' && path === '/orders') { requireUser(token); return orderList(state, params); }
  if (method === 'GET' && /^\/orders\/\d+$/.test(path)) {
    requireUser(token); const order = state.orders.find(o => o.order_id === Number(path.split('/').pop()));
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); return result(order);
  }
  if (method === 'POST' && /^\/orders\/\d+\/receipt$/.test(path)) {
    requireUser(token); const order = state.orders.find(o => o.order_id === Number(path.split('/')[2]));
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
    if (order.current_status !== 'delivered') fail(409, 'INVALID_ORDER_STATUS', 'Confirm receipt after delivery.');
    order.status_history.push({ from_status: 'delivered', to_status: 'completed', changed_at: new Date().toISOString() });
    order.current_status = 'completed'; order.fulfillment_version++; write(state); return result(order);
  }
  if (method === 'GET' && path === '/admin/orders') { requireUser(token, true); return orderList(state, params, true); }
  if (method === 'GET' && /^\/admin\/orders\/\d+$/.test(path)) {
    requireUser(token, true); const order = state.orders.find(o => o.order_id === Number(path.split('/').pop()));
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); return result(order);
  }
  if (method === 'PATCH' && /^\/admin\/orders\/\d+\/fulfillment$/.test(path)) {
    requireUser(token, true); const order = state.orders.find(o => o.order_id === Number(path.split('/')[3]));
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
    if (body.expected_status !== order.current_status || body.expected_version !== order.fulfillment_version)
      fail(409, 'ORDER_CHANGED', 'This order changed. Reload it before saving.');
    const next = { paid: 'packing', packing: 'shipped', shipped: 'delivered' }[order.current_status];
    if (body.status !== next && body.status !== order.current_status) fail(409, 'INVALID_ORDER_STATUS', 'This status change is not allowed.');
    const carrier = body.carrier === undefined ? order.carrier : body.carrier?.trim();
    const tracking_no = body.tracking_no === undefined ? order.tracking_no : body.tracking_no?.trim();
    if (['shipped', 'delivered'].includes(body.status) && (!carrier || !tracking_no)) fail(400, 'TRACKING_REQUIRED', 'Carrier and tracking number are required.');
    const before = order.current_status;
    order.current_status = body.status; order.carrier = carrier; order.tracking_no = tracking_no;
    order.fulfillment_version++;
    order.status_history.push({ from_status: before, to_status: body.status, changed_at: new Date().toISOString() });
    write(state); return result(order);
  }
  if (method === 'GET' && ['/reviews/reviewable', '/refund-requests/refundable'].includes(path)) { requireUser(token); return result([]); }
  fail(403, 'BROWSER_DEMO_UNAVAILABLE', 'This feature is not available in the browser-only portfolio demo.');
}

export function resetBrowserDemo() { localStorage.removeItem(KEY); }
