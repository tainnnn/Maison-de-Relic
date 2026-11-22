# Deploy the browser-only portfolio demo on Vercel

Import `tainnnn/Maison-de-Relic` as a **new** Vercel project under the personal account. Keep Root Directory at the repository root and Framework Preset at Other. The checked-in `vercel.json` builds `frontend/` into `public/` and enables the browser demo in the copied configuration. No Vercel environment variables, API service, database, Omise account, or email service are needed.

## What visitors can try

1. Open `/login`, select Customer, and sign in with the prefilled demo credentials.
2. Open a product from Home or Search, add it to Cart, select items, and use simulated PromptPay or TrueMoney payment at Checkout.
3. See the order at `/orders`. Sign out, select Staff on `/login`, and open `/admin/orders`.
4. Move the order through packing, shipped (enter carrier and tracking number), and delivered.
5. Sign in as Customer again to confirm receipt. The order becomes completed.

Inventory, cart, orders, and status history are saved in the visitor's `localStorage`. They persist across reloads in that browser, but they are **not shared between devices or browsers**. Clearing this site's browser storage resets the demo. Payments are simulations; no money is collected. The current team portrait files are absent from the deployed copy. The original Git history still contains those files, as requested for this personal repository.

The local Docker setup remains available for the real Express/PostgreSQL integration path. It is separate from this Vercel browser demo and does not touch the team's infrastructure.
