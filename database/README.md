# Database

ResQ-Mind uses PostgreSQL through Prisma for authentication, operational records, reports, and persisted simulation snapshots. The existing root `prisma/` directory is the canonical schema and migration location; `database/client.ts` is the shared client boundary used by the backend so duplicate Prisma schemas are not created.

## Local setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `AUTH_USERNAME`, and a strong `AUTH_PASSWORD`.
2. Generate the client: `npm run db:generate`.
3. Apply migrations: `npm run db:migrate`.
4. Create the first administrator: `npm run db:seed`.

The seed also creates the initial incident, Zones A-D, bounded response resources, and the four ResQ-Mind agents. It reads `AUTH_USERNAME` and `AUTH_PASSWORD`, stores only a bcrypt hash, and never logs or persists the raw password.

The server refuses to start in production without `DATABASE_URL`. In local development, the existing simulator can still run without PostgreSQL, but authentication and persistence require the database.

The `SimulationSnapshot` record preserves the active dashboard state. Resetting the simulation replaces only that current snapshot; users, reports, incidents, messages, conflicts, and response history remain stored.
