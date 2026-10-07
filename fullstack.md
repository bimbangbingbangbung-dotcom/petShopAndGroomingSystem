---
name: fullstack-developer
description: End-to-end guidance for fullstack work across a project — architecture decisions, API design, data modeling, auth, business logic, state management, testing, performance, security, and delivery. Use when building, refactoring, reviewing, or debugging a feature that spans the frontend, the backend, or the boundary between them, or when deciding how a new capability should be split across the stack.
---

# Fullstack Developer

Work as the person who owns the whole request path: what the user clicks, what travels over the wire, what the server does with it, what the database stores, and what happens when any of those fail. A fullstack decision is never made on one side of the stack in isolation — every choice is a tradeoff between the browser, the network, the server, and the store.

## Ground rules

**Follow the existing architecture before proposing a new one.** Read `SYSTEM_ARCHITECTURE.md` and the surrounding code first. Match the project's module layout, naming, error format, and conventions. If the current system does something that looks redundant, understand why before "fixing" it — the reason may be a constraint you can't see from one file.

**Keep the contract the single source of truth.** The API surface, database schema, and shared types are contracts between people and processes. Change them deliberately, version them when others depend on them, and never let the frontend guess at a shape the backend doesn't guarantee.

**Do the smallest thing that is correct and complete.** Prefer one clear path over a framework of options. Add an abstraction when a third caller appears, not when the first one does.

**Fail loudly, recover gracefully.** Every boundary — network call, file write, DB query, third-party API — can fail. Decide what the failure looks like to the user, to the log, and to the retry logic before writing the happy path.

## Choosing where logic lives

The most common fullstack mistake is putting logic in the wrong tier. Use this order:

1. **Presentation only** — layout, formatting, labels, derived display values. Lives in the frontend.
2. **Client-side domain logic** — instant feedback, optimistic UI, filtering an already-loaded list, form validation that mirrors a server rule. Lives in the frontend, *in addition to* server validation, never instead of it.
3. **Server-side domain logic** — anything that touches money, permissions, inventory, uniqueness, rate limits, or data shared by more than one client. Lives on the backend, always.
4. **Database-enforced invariants** — things that must be true even if every application server misbehaves: foreign keys, unique constraints, `CHECK` constraints, transactional integrity. Lives in the schema.

If a rule can be bypassed by a user with `curl`, it is not a security control. If two clients can disagree about it, it is not a business rule. If it must hold during a crash, it is not application code.

Never trust anything from the client: form fields, headers, JWT claims you didn't verify, hidden inputs, `localStorage`. Validate type, range, format, and authorization on every request.

## API design

Design the API for the consumer, not the database. Resources and their relationships drive the shape; the table structure does not.

- Use consistent nouns and HTTP semantics: `GET /projects/:id`, `POST /projects`, `PATCH /projects/:id`, `DELETE /projects/:id`. Avoid verbs in paths except for genuine actions (`POST /projects/:id/publish`).
- `GET` must be safe and idempotent. `PUT` replaces and is idempotent. `PATCH` partially updates. `POST` creates and is neither.
- Return the status code the client can act on: `200`/`201`/`204`, `400` malformed, `401` unauthenticated, `403` unauthorized, `404` absent, `409` conflict, `422` semantic validation failure, `429` throttled, `500` our bug.
- Use one error envelope everywhere and document it: a stable machine-readable `code`, a human `message`, and optional `field`/`details`. Clients switch on `code`, never on prose.
- Paginate any list that can grow. Cursor pagination for infinite scroll and stable ordering; offset for numbered pages. Always return a total or a `hasMore` flag.
- Make partial failure explicit. If one item of a batch fails, say which and why — don't return `200` with silently missing data.
- Idempotency keys on payment and other non-repeatable `POST`s; otherwise a client retry double-charges.
- Version only when you must, and prefer additive changes: new optional fields, never renamed or repurposed ones.

### Between the two sides

- Define request/response types once and share them. Generating types from the OpenAPI spec, or keeping a shared `packages/types` module, prevents the drift that causes most frontend/backend bug reports.
- Decide upload, download, and streaming behavior up front — large payloads over a request/response cycle is the usual performance cliff.
- Handle time as UTC on the wire (`ISO 8601`), with the timezone attached only for display. Handle money as integer minor units or a fixed-precision decimal, never a float.
- Be explicit about `null` vs. missing vs. empty. Pick one and document it.

## Data modeling

Model from the invariants and the query patterns, in that order.

- Normalize until it hurts, denormalize until it works. Duplicated data is fine when it's read-heavy and you have a single writer; it's a liability when writers are concurrent.
- Every relationship gets a foreign key with the delete behavior you actually want (`RESTRICT` for data you can't lose, `CASCADE` for owned children, `SET NULL` for optional attribution).
- Index for the queries you run: equality columns first, then the sort column, and make the index cover the columns you select when it's cheap. Every index costs writes and storage — add it against a real `EXPLAIN`, not a hunch.
- Constraints carry the truth: `NOT NULL`, `UNIQUE`, `CHECK`, referential integrity. Application-level validation is a courtesy; the schema is the guarantee.
- Migrations are additive and reversible by policy: add the new column, backfill, switch reads, switch writes, then drop the old one. Never edit a migration that has run anywhere — write a new one.
- Audit fields (`created_at`, `updated_at`, and `created_by` where it matters) from the first table.
- Choose the database by access pattern: relational for joins, transactions, and integrity; document/graph where the shape really is hierarchical or polymorphic; a key-value or search engine as an *accelerator* alongside the source of truth, never as the only copy of data you can't rebuild.

### Transactions

Use a transaction whenever an operation must be atomic across more than one write. Keep transactions short, do no external I/O inside one (no HTTP calls, no email, no file uploads), and make lock ordering consistent to avoid deadlocks. If a background job must follow a write, commit first, then enqueue — use an outbox table when you need the guarantee.

## Authentication and authorization

- **Authentication** proves who you are; **authorization** decides what you may do. They are separate checks and both belong on the server.
- Session cookies (`HttpOnly`, `Secure`, `SameSite`) for browser apps — they give you real logout and CSRF protection for free. Tokens for machine-to-machine and native clients. If you use JWTs: short expiry, refresh rotation, and a revocation story on day one, not after the first incident.
- Hash passwords with a memory-hard algorithm (argon2id, scrypt, bcrypt). Never log credentials, never return them, never "encrypt" them.
- Authorization checks are per-object, not per-route: "can *this* user edit *this* record" — verify ownership or membership by querying the resource, not by trusting an ID in the URL.
- Deny by default. A new endpoint with no permission check is the most common vulnerability in an otherwise careful codebase.
- Rate-limit login, password reset, and any expensive unauthenticated endpoint. Make brute force visible in your logs.

## Frontend responsibilities

- Own a single normalized client cache rather than scattering fetches through components. One place to read data, one place to invalidate it, one place to handle staleness.
- Derive state instead of duplicating it. If a value can be computed from other state, don't also store it.
- Optimistic updates are welcome when you can roll back convincingly; otherwise show the spinner.
- Render the four states for every screen: loading, empty, error, and success. "Empty" is designed content with a next action; "error" says what happened and what to do, with a retry.
- Form validation runs client-side for instant feedback and server-side for truth. The server message wins, and it should land next to the field that caused it.
- Mutations disable their own button while in flight. Double-submit is a backend bug and a frontend bug.
- Respect `prefers-reduced-motion`, keyboard focus visibility, and 4.5:1 contrast as a floor, not a stretch goal.

## Error handling and observability

- Errors are data at every boundary. Translate exceptions into the error envelope at the edge; let internal code throw.
- Distinguish *expected* failures (validation, not found, conflict) from *bugs*. Expected failures are responses. Bugs are logged with context and reported, and the client gets a generic message plus a correlation ID.
- Never expose stack traces, SQL, file paths, or internal IDs to the client in production.
- Structured logs: one line per event with the request ID, user/tenant ID, operation, duration, and outcome. Log the transition points — request received, query executed, job started/finished — not every line inside a loop.
- Correlate with a request ID that flows from the frontend header through the server to the log line. When a user says "it broke," you need to find their request.
- Metrics that answer questions: request rate, error rate, latency percentiles (p50/p95/p99), queue depth, cache hit rate, DB connections in use. Alerts on symptoms users feel, not on CPU.
- Errors and empty states use the same copy rules as the rest of the UI: plain language, say what happened, say what to do next.

## Performance

Measure before optimizing, and measure the thing users feel — time to first meaningful paint, interaction latency, p95 API latency — not a microbenchmark.

Typical wins, in order of return:

1. **N+1 queries.** One query to list, one per row to enrich. Batch or join it. This is the single most common backend slowdown.
2. **Missing or wrong indexes.** Confirm with `EXPLAIN`, verify the row estimates match reality.
3. **Waterfalls in the frontend.** Fetch the data the page needs in parallel or server-side; don't let component mount order serialize independent requests.
4. **Payload size.** Ship images in a modern format at the right dimensions, lazy-load below the fold, code-split by route, gzip or brotli everything.
5. **Caching, at the right layer.** HTTP caching (`Cache-Control`, `ETag`) for static and semi-static responses; a memo or query cache in the client; an in-process cache for expensive computation; Redis only when the working set exceeds one process. Cache invalidation is the real work — decide the key, the TTL, and the invalidation trigger together or don't cache it.
6. **Chatty round trips.** Batch writes, upsert instead of read-then-write, and move N sequential calls into one transaction or one batch endpoint.
7. **Work off the request path.** Email, image processing, webhooks, and report generation go to a queue. The user should never wait for them.

Never hold a database connection during external I/O. Bound every pool and queue; unbounded concurrency is how a traffic spike becomes an outage.

## Security baseline

- Validate and sanitize on input; escape on output. Use parameterized queries — string-concatenated SQL is never acceptable.
- CSRF protection for cookie-authenticated state-changing requests; strict CORS with explicit origins (never `*` with credentials).
- Security headers: CSP, HSTS, `X-Content-Type-Options`, a referrer policy. Set them once, at the edge.
- Uploads: validate type by content, not extension; cap size; store outside the web root with generated names; scan if they're user-facing.
- Secrets come from the environment or a secret manager, never from the repo. Rotate them. Keep `.env` out of git and `.env.example` in it.
- Keep dependencies current and audit them in CI. Remove what you don't use — abandoned code you don't call can't be exploited.
- Principle of least privilege for database users, API keys, and service accounts.

## Testing

Test at the level where a break would be expensive to find.

- **Unit** for pure logic: business rules, transformations, validators, permission decisions. Fast and numerous.
- **Integration** for the seams: handler + real database (a disposable one, in CI), queue, and cache. This is where most regressions actually live — spend your budget here.
- **Contract** for the API surface: the request/response shape the frontend depends on, generated from the schema so drift fails the build.
- **End-to-end** for a handful of critical journeys: sign up, purchase, publish, the one flow that must never break. Few, stable, and resistant to flake.
- **Edge cases earn their keep**: empty list, boundary values, concurrent duplicate submit, expired token, permissions denied, upstream timeout.

Rules that keep tests useful: test behavior, not implementation (assert on the response and the database, not on private calls); one assertion of interest per test; deterministic — no real clock, no real network, seeded randomness; if a test needs a comment explaining what it means, rewrite it. A failing test must point at the change that broke it.

CI order: lint and typecheck, unit, integration, build, E2E. Fail fast on the cheap checks.

## Delivery

- Small, reviewable commits with a message that says *why*. Separate refactors from behavior changes so both are legible.
- Feature flags for anything risky or incomplete — they decouple deploy from release and give you a kill switch.
- Database migrations deploy before the code that needs them, and the code must tolerate both schema versions during the rollout window.
- Roll back by reverting code, not by running destructive migrations. Keep every deploy reversible.
- Trunk-based or short-lived branches; a merge queue or required green CI on the main branch; never commit directly to it.
- Environment parity: the same config shape in dev, staging, and production, differing only in values. "Works on my machine" is a config bug.

## Review checklist

Before calling a feature done, walk this:

**Contract**
- [ ] Request/response types shared and validated at the boundary
- [ ] Status codes and one consistent error envelope
- [ ] List endpoints paginated; no unbounded `SELECT *`
- [ ] Idempotency handled where a retry would duplicate work

**Data**
- [ ] Constraints and foreign keys express the invariants
- [ ] Queries hit an index; `EXPLAIN` checked for anything new
- [ ] Migration is additive, reversible, and safe under the running version of the code
- [ ] Transactions wrap multi-write operations; no external I/O inside one

**Security**
- [ ] Every new endpoint authenticates and authorizes per-object, deny by default
- [ ] No client input trusted; parameterized queries only
- [ ] Secrets absent from the repo and from logs
- [ ] Uploads, rate limits, and CORS reviewed for the new surface

**Frontend**
- [ ] Loading, empty, error, and success states all designed
- [ ] Mutations disable while in flight; optimistic changes roll back
- [ ] Accessible: keyboard path, focus visibility, contrast, reduced motion
- [ ] No data fetched twice; derived state derived, not stored

**Operations**
- [ ] Structured log with request correlation at the meaningful transitions
- [ ] User-facing failure path defined, with a correlation ID
- [ ] Metrics or a health signal for the new dependency
- [ ] Tests cover the seam that could break silently
- [ ] Deploy is reversible and config matches across environments

## Anti-patterns

- Validating only in the browser, or only in the frontend's TypeScript types.
- Returning `200 OK` with an error in the body.
- Letting the frontend paginate by slicing an array the server already sent in full.
- Reading a row, then writing it back, to implement a counter or a balance.
- Storing a JWT's payload as truth without verifying the signature, or trusting an `X-User-Id` header.
- A `getUser` call inside a `for` loop over 500 rows.
- Caching without a key scheme, a TTL, and an invalidation path — and calling it a performance fix.
- Swallowing exceptions with `catch {}` and logging at `debug` level.
- Adding Redis, Kafka, or a microservice before a single profile says the current design can't hold.
- Writing an E2E test for logic that a unit test covers in a millisecond.
