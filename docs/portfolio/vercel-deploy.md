# Deploy the portfolio demo on Vercel

This is a separate public demo of the R5 flow. It must use a **new database**; never connect it to the team database or the local Docker database. The site and Express API are deployed together from the repository root. Vercel cannot persist the Docker Compose PostgreSQL volume, so provision a PostgreSQL database with the `vector` extension (for example, a dedicated Neon database) first.

## Vercel project

Import `tainnnn/Maison-de-Relic` as a **new** Vercel project. Keep the Root Directory at the repository root, Framework Preset at Other, and use the checked-in `vercel.json`. Do not connect this repo to the team Vercel project.

Configure these project environment variables for Production before the first successful deployment:

| Name | Value |
|---|---|
| `DATABASE_URL` | Connection string for the new portfolio PostgreSQL database only |
| `DATABASE_SSL` | `true` |
| `JWT_SECRET` | A long, random value generated for this portfolio instance |
| `PORTFOLIO_DEMO` | `true` |
| `TRUST_PROXY` | `1` |
| `ALLOWED_ORIGINS` | Portfolio site's final origin if a custom domain is used |

Do not configure Omise, Supabase service keys, or mail credentials. Simulated checkout is selected when `PORTFOLIO_DEMO=true` and both Omise keys are absent. The API blocks account creation, email flows, product changes, and unrelated write actions. The test accounts are shown on the login page.

The build copies `frontend/` into the static output directory, then runs database migrations and seeds once according to their tracking tables. A missing database or JWT secret fails the build instead of publishing a broken login page. `api/index.js` exposes the Express app as a Vercel Function. The `/api/*` rewrite keeps frontend requests on the same origin.

## Verify the deployed site

1. Open `/api/health` and confirm `status: ok` and `db: ok`.
2. Open `/login`, choose Customer, and sign in with the prefilled test account.
3. Open a product detail, add it to `/cart`, check out the selected item, and use simulated payment. Confirm the order appears at `/orders` and stock decreases.
4. Sign out, select Staff on `/login`, and open `/admin/orders`. Advance the same order through packing, shipped (with a tracking number), and delivered.
5. Sign in as Customer again, open the order, and confirm receipt. Check that the final state is completed.
6. Check that register and account management actions stay locked. Check that team portraits are absent from the current deployed files.

The public demo database is shared by all visitors. Reset or reseed it separately if the sample inventory is exhausted. The original team Git history still contains the original team image files, as requested when this personal copy was created.
