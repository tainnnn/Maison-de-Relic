// Vercel runs this Express app as a Function. The Docker entry point remains
// backend/src/server.js for local development.
module.exports = require('../backend/src/app');
