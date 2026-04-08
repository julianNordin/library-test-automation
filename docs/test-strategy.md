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

## What the suite runs against

Nothing in this project is substituted for anything else. The database is SQL Server in a
container, the API is a process listening on a port, and the client is the production bundle,
served the way it ships and driven by a real browser.

That is worth stating plainly, because it is the whole difference between this tier and the two
it sits on top of. The API's own integration tests run in-process against an in-memory provider,
which never executes a line of SQL. The client's run in a simulated DOM against handlers that
*reimplement* the API — handlers that have drifted from it more than once. Both are good tests of
what they cover. Neither can catch a disagreement between the two projects, because neither one
ever puts them in the same room.

### The suite owns both servers

Playwright starts both applications, waits for them, runs against them and stops them again. The
alternative — documenting two commands and trusting the reader to run them — is not merely less
convenient. On this stack, both applications leave a survivor behind when they are started by
hand.

`dotnet run` launches the application as a *child* process. Stopping `dotnet run` stops the
launcher; the application carries on holding port 5018, and with it a lock on
`LibrarySystem.Api.dll`, so the next build fails with MSB3027 — an error that names a file and
says nothing about the process responsible. `vite preview` behaves the same way on the other side
of the stack. Playwright stops the whole process tree, so both ports come back.

One consequence is worth knowing rather than discovering. With `reuseExistingServer` on, which is
how it runs locally, Playwright probes the URL *before* it runs the command — so a server left
over from an earlier session is reused and the build step is skipped with it. The loop stays
fast, and the result is about whatever was built last time. That is a fair trade while iterating
and an unacceptable one for a result anybody relies on, which is why CI turns it off and treats a
survivor as an error rather than an opportunity.

### Readiness is a database check, not an open port

`webServer.url` polls until something answers 2xx, so whichever URL it polls is the project's
working definition of "ready". It polls `/health`, which is backed by a check on the database
context: the endpoint reports ready only when the API can reach its database, which is the
precondition every test in this suite actually has.

Polling a domain endpoint such as `/api/books` would have folded two different questions into
one — whether the system is ready, and whether it holds data. The first is infrastructure and the
second is the subject of the tests, and a suite that cannot start until its own assertions would
already pass has stopped measuring anything.

Waiting on an open port would have been weaker again, though not in the way one might guess. This
API applies its migrations and seeds *before* Kestrel starts listening, so on a cold start the
port and the health check become true within moments of each other. They come apart afterwards.
Stop the database container while the API is running and `/health` turns `503` — verified, along
with its return to `200` once the container is back, with no restart in between — while the port
stays open and every request that touches data fails. A port check calls that ready.

### One origin, so no CORS anywhere

The browser tier runs against `:4173`, where Vite's preview server serves the built bundle and
forwards `/api` to the API. The bundle therefore sees a single origin, exactly as it is designed
to be deployed, and the API needs no cross-origin policy for the suite to work — which means the
suite has not quietly required a configuration nobody ships. This costs no change to the client:
Vite's preview server inherits the dev server's proxy, as recorded above.
