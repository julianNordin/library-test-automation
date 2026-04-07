# Test strategy

Why the tests in this repository are shaped the way they are.

Written while the suite is built rather than reconstructed afterwards, so each section records a
decision at the point it was actually forced. Sections are added as the phases that produce them
land.

## The system under test is not ours to fix

`src/` is a snapshot of two projects written and published separately: an ASP.NET Core Web API
and its React client. This project tests them. It does not own them, and it does not improve
them.

That distinction needs a rule, because the pressure to blur it is constant and always sounds
reasonable in the moment — a test is hard to write, the code under test is slightly awkward, and
a two-line change would make the problem disappear.

> **The system under test is modified only to make it observable.**
> **It is never modified to make a test pass.**

The difference is whether the change alters behaviour a user could notice. Exposing state that
already exists is observability. Changing what the software *does* so an assertion goes green is
tampering — and it destroys the only thing the suite is for, because from then on the tests are
evidence about a system that nobody ships.

### Changes made under this rule

| Change | Why this is observability |
|---|---|
| `GET /health`, backed by `AddDbContextCheck<AppDbContext>()` | Reports a fact that was already true — whether the API can reach its database — through an endpoint instead of only through a failed request. No behaviour a user could see is different. It exists because the suite needs a readiness signal that means "ready to serve a request that touches data", not merely "the process started". |

That is the complete list. One change.

### Changes considered and rejected

**A `preview.proxy` block in `vite.config.ts`** — planned, then found unnecessary. Vite's preview
server defaults `preview.proxy` to `server.proxy`, so the production bundle is already served
same-origin with `/api` forwarded to the API. Verified rather than assumed: the built bundle on
:4173 returns real data from `/api/books` and carries no `Access-Control-*` headers at all, which
is what same-origin looks like as opposed to working CORS. Testing the shipped artifact therefore
costs no change to the client and no CORS policy on the API.

**Startup resilience, so `/health` could be tested in its unhealthy state.** The API calls
`Database.Migrate()` during startup without guarding it, so an unreachable database kills host
construction before any request is served — which makes the failure path unreachable from the
xUnit harness. Wrapping that in a try/catch would have made the test writable.

It was rejected because it is exactly what the rule forbids: changing what the software does at
startup, in order to make a test pass. The behaviour would have been genuinely different — an API
that starts anyway with a dead database is not the API that ships today.

The failure path is verified instead by doing it for real: with the database container stopped,
`/health` returns `503 Unhealthy`, and returns to `200 Healthy` once it is back, with no API
restart. The xUnit test covers only what that harness can honestly prove — that the endpoint is
mapped and reports healthy when the database is reachable — and its comment says so, so the gap
is visible rather than implied.

That trade is worth stating plainly, because it recurs: **a test you cannot write honestly is
better left unwritten and documented than written against a system you bent to accept it.**
