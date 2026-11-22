// The portfolio server proxies /api to its private API container.
export const API_BASE = `${window.location.origin}/api`;
export const PORTFOLIO_DEMO = true;
// The Vercel build turns this on in its copied static files. Docker keeps
// using its isolated PostgreSQL API for local integration testing.
export const BROWSER_DEMO = false;

// Browser events are stored only in this portfolio database.
export const EVENTS_ENABLED = true;
