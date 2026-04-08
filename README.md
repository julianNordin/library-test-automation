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
| API and end-to-end (this project) | `tests/` | not yet written |

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

## Status

Early. The stack under test is in place and both inherited suites are green; the test suite
itself is not written yet.
