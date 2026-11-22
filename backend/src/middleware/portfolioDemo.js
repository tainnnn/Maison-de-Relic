const env = require('../config/env');

// Public portfolio instance: let visitors exercise R5 against its own seeded
// database, while stopping account creation, email flows, catalog edits, and
// other write operations outside the showcased purchase path.
const allowedWrites = [
  /^POST \/api\/auth\/login$/,
  /^POST \/api\/cart\/items$/,
  /^PATCH \/api\/cart\/items\/\d+$/,
  /^DELETE \/api\/cart\/items\/\d+$/,
  /^POST \/api\/cart\/item-removals$/,
  /^POST \/api\/orders\/quotes$/,
  /^POST \/api\/orders$/,
  /^POST \/api\/orders\/\d+\/receipt$/,
  /^PATCH \/api\/admin\/orders\/\d+\/fulfillment$/,
  /^POST \/api\/wishlist$/,
  /^DELETE \/api\/wishlist\/\d+$/,
  /^POST \/api\/reviews$/,
  /^POST \/api\/refund-requests$/,
  /^PATCH \/api\/admin\/refund-requests\/\d+$/,
  /^POST \/api\/support-tickets$/,
  /^PATCH \/api\/admin\/support-tickets\/\d+$/,
  /^POST \/api\/events$/,
];
const allowedReads = [
  /^\/api\/health$/,
  /^\/api\/auth\/me$/,
  /^\/api\/products(?:\/\d+)?$/,
  /^\/api\/products\/\d+\/reviews$/,
  /^\/api\/categories(?:\/\d+)?$/,
  /^\/api\/series(?:\/\d+)?$/,
  /^\/api\/search(?:\/.*)?$/,
  /^\/api\/recommend(?:\/.*)?$/,
  /^\/api\/addresses$/,
  /^\/api\/addresses\/\d+$/,
  /^\/api\/profile$/,
  /^\/api\/wishlist(?:\/ids)?$/,
  /^\/api\/reviews\/(?:reviewable|mine)$/,
  /^\/api\/refund-requests(?:\/refundable|\/\d+)?$/,
  /^\/api\/admin\/refund-requests(?:\/\d+)?$/,
  /^\/api\/admin\/sales-summary$/,
  /^\/api\/support-tickets(?:\/\d+)?$/,
  /^\/api\/admin\/support-tickets(?:\/assignees|\/\d+)?$/,
  /^\/api\/cart$/,
  /^\/api\/orders(?:\/\d+)?$/,
  /^\/api\/orders\/payment-config$/,
  /^\/api\/orders\/payment-attempts\/active$/,
  /^\/api\/admin\/orders(?:\/\d+)?$/,
];

module.exports = function portfolioDemo(req, res, next) {
  if (!env.portfolioDemo || req.method === 'OPTIONS') return next();
  if (req.method === 'POST' && req.path === '/api/auth/login' &&
      !['customer', 'staff'].includes(req.body?.username)) {
    return res.status(403).json({ error: {
      code: 'PORTFOLIO_DEMO_ACCOUNT_ONLY',
      message: 'Choose one of the two test accounts shown on the sign-in page.',
    } });
  }
  if (['GET', 'HEAD'].includes(req.method) && allowedReads.some(pattern => pattern.test(req.path))) return next();
  const request = `${req.method} ${req.path}`;
  if (allowedWrites.some(pattern => pattern.test(request))) return next();
  return res.status(403).json({
    error: {
      code: 'PORTFOLIO_DEMO_LOCKED',
      message: 'This action is disabled in the public portfolio demo.',
    },
  });
};
