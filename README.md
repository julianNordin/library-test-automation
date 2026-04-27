# LibrarySystem E2E

Automated end-to-end and API tests for a book-lending stack: an ASP.NET Core Web API and a
React + TypeScript single-page client, tested *together* — real browser, real HTTP, real SQL
Server — rather than each one tested alone against a mock of the other.

> **Pre-build stub.** The suite is not written yet. This file is rewritten in the final phase,
> once there are results worth describing; it exists now so the repository states its intent
> from the first commit.

## Why

Both applications already ship tests, and both stop at the same boundary.

The API's integration tests run in-process against an in-memory database. The client's run in a
simulated DOM against request handlers that *reimplement* the API — handlers that have drifted
from the real thing more than once. Neither suite can catch a contract break between the two,
because neither one ever puts them in the same room.

This project puts them in the same room, and adds the reporting and CI that make the whole test
pyramid visible in one place.

## Planned scope

- **Playwright** driving the production client bundle against the running API
- An **API tier** of HTTP-level tests over the real server and a real database
- **Page objects** and **test data builders**, with isolation by unique data rather than teardown
- **Accessibility** scanning with axe-core
- **Coverage** merged across C# and TypeScript into a single report
- The **full suite in CI**, with traces retained from failures
- A **fault-injection matrix** — defects seeded deliberately, and a record of which tier caught
  each one

## The system under test

`src/` is a **vendored snapshot** of two separate projects — an ASP.NET Core Web API and its
React client — copied in without their own git history so this repository builds, runs and tests
end to end from a clean clone. They are not the work being demonstrated here. They are the thing
being tested, and they are modified only where the suite needs a way to *observe* them, never to
make a test pass.

Their own suites come along with them, and they are the base of the pyramid this project
completes:

| Tier | Lives in | Tests |
|---|---|---|
| Unit and in-process integration (C#) | `src/LibrarySystem.Api.Tests` | 11 |
| Component and mocked integration (TypeScript) | `src/web/src` | 21 |
| API and end-to-end (this project) | `tests/` | 74 |

## Layout

```
LibrarySystem.sln           builds the API and its tests from the repository root
src/
  LibrarySystem.Api/        the API under test
  LibrarySystem.Api.Tests/  its xUnit suite
  web/                      the React client and its Vitest suite
tests/                      the substance of this project
docs/                       test strategy, accessibility findings, fault-injection matrix
```

## Running what exists today

The two inherited suites need nothing but the SDKs — one uses an in-memory database, the other
mocks its requests:

```bash
dotnet test                       # the API's xUnit suite, from the repository root
cd src/web && npm ci && npm test  # the client's Vitest suite
```

## The test database

Everything this project adds runs against a real SQL Server in a container. One compose file
defines it and CI uses that same file, so the database you test against locally and the one CI
tests against cannot drift apart.

```bash
cp .env.example .env   # throwaway local credentials
npm ci
npm run db:up          # waits for the health check, not merely for the container to exist
```

`db:up` blocks until SQL Server actually accepts connections. That is 20-40 seconds on a cold
start, and waiting on "the container is running" instead is the classic way to get a login
failure that looks convincingly like a wrong password.

Point the API at it and it creates the schema from migrations and seeds it on first start:

```bash
dotnet build src/LibrarySystem.Api
export ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=LibrarySystemDb;User Id=sa;Password=LocalTestPassw0rd;TrustServerCertificate=True"
export ASPNETCORE_URLS=http://localhost:5018
dotnet src/LibrarySystem.Api/bin/Debug/net9.0/LibrarySystem.Api.dll
```

It is ready when `/health` says so:

```bash
curl http://localhost:5018/health   # Healthy
```

That endpoint is the one change this project makes to the system under test, and it is backed by
a database check — so it reports `503 Unhealthy` when the database is unreachable, not just when
the process is dead. That is the difference between a readiness signal the suite can wait on and
one that lies. See [docs/test-strategy.md](docs/test-strategy.md) for the rule that governs
changes to the code under test, and for the changes that were considered and rejected under it.

Three further details are deliberate. The environment variable **wins over**
`src/LibrarySystem.Api/appsettings.Development.json`, which still points at a local SQL Express
instance: environment variables are layered after JSON files in ASP.NET Core's configuration
order, so the vendored file is left exactly as its own project wrote it. The built assembly is
launched directly rather than through `dotnet run`, which starts the application as a child
process that outlives a request to stop its parent — leaving port 5018 held by something you can
no longer see. And the URL is set explicitly, because `launchSettings.json` is read by `dotnet
run` and by nothing else: launch the assembly without `ASPNETCORE_URLS` and it binds its own
default of port 5000, while every instruction here carries on saying 5018.

Back to a clean database:

```powershell
./scripts/db-reset.ps1          # drop it; the next API start rebuilds and reseeds
./scripts/db-reset.ps1 -Hard    # destroy the volume too, for a completely fresh engine
npm run db:down                 # stop the container
```

## Running the suite

From a clean clone, with Docker running:

```bash
cp .env.example .env   # throwaway local credentials
npm ci
npm run db:up
npm run test:e2e
```

Nothing else needs starting, and nothing is left running afterwards. Playwright brings both
applications up itself, waits for them, runs the tests and stops them again:

1. it builds the API and launches the built assembly on `:5018`, waiting on `/health` — which is
   backed by a database check, so it means *ready to serve a request that touches data* rather
   than merely *the process started*
2. it builds the client and serves the **production bundle** through Vite's preview server on
   `:4173`, which forwards `/api` to the API — so the browser sees a single origin and the API
   needs no CORS policy at all
3. it runs both projects: `api`, which speaks HTTP with no browser, and `ui`, which drives
   Chromium against that bundle

That the suite owns the lifecycle is deliberate rather than convenient. Started by hand, each
application leaves a survivor behind — `dotnet run` launches the API as a child process that
outlives its parent, and `vite preview` does the same on the other side of the stack. Playwright
stops the whole process tree, so both ports come back.

```bash
npm run test:e2e:api      # the browserless tier alone
npm run test:e2e:ui       # the browser tier alone
npm run test:e2e:a11y     # the axe-core scans alone
npm run test:e2e:headed   # the browser tier, with a visible browser
npm run test:e2e:report   # open the report from the last run
npm run lint              # the suite lints itself; see below
npm run typecheck         # TypeScript, no emit
```

The suite lints itself, and the rules it enforces are the ones that otherwise fail quietly: no
`waitForTimeout`, no `force: true`, no test without an assertion, no page object that asserts,
and no spec importing `test` from `@playwright/test` instead of from the suite's own fixtures.
[docs/test-strategy.md](docs/test-strategy.md) gives the reason for each.

A failure leaves evidence in `test-results/`: a screenshot and a video of each one, and a trace
where a retry was involved. Locally there are no retries — a failure is meant to be visible the
first time it happens — so traces come from CI, which retries twice to absorb the noise of a
shared runner. All of it is git-ignored.

## Coverage

One report across both languages — Cobertura from coverlet, lcov from v8, merged by
ReportGenerator:

```powershell
./scripts/coverage.ps1          # both suites, merged report, floors enforced
./scripts/coverage.ps1 -Open    # ...and open it
```

| | Line | Branch |
|---|---|---|
| **Combined** | **46.0%** | **56.7%** |
| `librarysystem-web` (TypeScript) | 80.2% | 61.1% |
| `LibrarySystem.Api` (C#) | 36.2% | 45.5% |

That C# figure is the interesting one, and it is lower than the API is tested. Whole controllers
read as 0% while being exercised repeatedly by the tests in `tests/api/`, because coverage
measures code that ran inside the *instrumented process* and those tests drive the API as a
separate one. The end-to-end tiers are deliberately outside the number;
[docs/test-strategy.md](docs/test-strategy.md) explains why including them would make the figure
less honest rather than more flattering.

## Accessibility

Every route is scanned with axe-core against WCAG 2.0 and 2.1 at levels A and AA, along with three
states a scan of a freshly loaded page never sees: a form showing validation errors, a live region
announcing a toast, and a row midway through a confirmation step. No violations.

[docs/accessibility.md](docs/accessibility.md) records what that does and does not mean — roughly
a third of real barriers are detectable this way — and one finding worth repeating here: because
every locator in the suite is a role or a label, deleting a form label breaks the *functional*
tests as well as the scans. A suite hung on test ids would have gone on passing while the form
became unusable.

## Status

The suite runs end to end: 74 Playwright tests across three projects — HTTP-level tests against
the real API, browser tests against the production bundle, and accessibility scans — on top of the
33 inherited unit tests. Coverage is merged across both languages. Still to come: continuous
integration, and a fault-injection pass that seeds real defects to find out which tier catches
each one.
