const env = require('../../config/env');
// Missing BOTH keys is intentional offline Demo. Partial/invalid/Live configuration
// and network/provider failures must never silently switch payment modes.
function paymentMode({ isProduction = env.isProduction, omise = env.omise, portfolioDemo = env.portfolioDemo } = {}) {
  return (portfolioDemo || !isProduction) && !omise.publicKey && !omise.secretKey ? 'simulated' : 'omise_test';
}
module.exports = { paymentMode };
