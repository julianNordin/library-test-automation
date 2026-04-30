# LibrarySystem E2E

[![CI](https://github.com/julianNordin/library-test-automation/actions/workflows/ci.yml/badge.svg)](https://github.com/julianNordin/library-test-automation/actions/workflows/ci.yml)

An automated test suite for a book-lending stack — an ASP.NET Core Web API and a React client —
tested **together**: a real browser, driving the production bundle, against the running API,
against SQL Server in a container.

**The test suite is the project.** `src/` holds the two applications under test, vendored in and
barely touched. What is worth reading is [`tests/`](tests),
[`playwright.config.ts`](playwright.config.ts), [`docs/test-strategy.md`](docs/test-strategy.md)
and the [CI workflow](.github/workflows/ci.yml).

## Does it actually catch anything?

Eight plausible defects were seeded into the applications, one at a time, and every tier was run
against each — not absurd changes designed to be caught, but mistakes somebody could make in an
afternoon.

| # | Defect | Where | xUnit (12) | Vitest (21) | `api` (35) | `ui` (29) | `a11y` (10) |
|---|---|---|---|---|---|---|---|
| 1 | Remove the active-loan cap check | API | ✅ | – | ✅ | ✅ | – |
| 2 | Loan period 14 days → 15 | API | ✅ | – | ✅ | ❌ | – |
| 3 | Drop the ISBN validation rule | API | ❌ | – | ✅ | – | – |
| 4 | Narrow the error content-type check | client | – | ✅ | – | ✅ | – |
| 5 | Invert the availability filter | client | – | ✅ | – | ✅ | – |
| 6 | Rename the `overdue` route | API | ❌ | – | ✅ | ✅ | – |
| 7 | Remove a form label | client | – | ✅ | – | ✅ | ✅ |
| 8 | Wrong field in a DTO | API | ❌ | – | ✅ | ✅ | – |

✅ caught · ❌ could have seen it and did not · – structurally cannot see it

**Nothing escaped.** Three things the exercise showed, all detailed in
[docs/fault-injection.md](docs/fault-injection.md):

- The API's own twelve tests **missed three of the five defects in its own code**. Its green tick
  said nothing about any of them.
- **One defect was caught by a single test in the entire repository** — a dropped validation rule,
  caught only because that test asserts the *complete set* of error keys rather than that
  validation failed. The browser cannot reach it at all: the client has no form for creating a
  book.
- Removing a `<label>` failed **three ordinary browser tests** as well as four accessibility
  scans. Every locator here is a role or a label, so a control that stops being perceivable also
  stops being findable.

## Why this exists

Both applications already ship tests, and both stop at the same boundary.

The API's integration tests run in-process against an in-memory provider that never executes a
line of SQL. The client's run in a simulated DOM against handlers that *reimplement* the API —
handlers that have drifted from it more than once. Both are good tests of what they cover.
Neither can catch a disagreement between the two projects, because neither one ever puts them in
the same room.

That matters more than it sounds. Several of this domain's rules are not enforced in application
code at all: a duplicate ISBN is refused only because SQL Server rejects the insert, and the
in-memory provider does not enforce a unique index. The rules most worth testing are the ones the
existing suites cannot reach.

## The pyramid

| Tier | Lives in | Tests | Sees |
|---|---|---|---|
| Unit and in-process integration (C#) | `src/LibrarySystem.Api.Tests` | 12 | the API, with an in-memory database |
| Component and mocked integration (TS) | `src/web/src` | 21 | the client, with mocked requests |
| **API** (this project) | `tests/api` | 35 | real HTTP, real controllers, real SQL Server |
| **Browser** (this project) | `tests/ui` | 29 | the production bundle in Chromium, against all of it |
| **Accessibility** (this project) | `tests/a11y` | 10 | what axe-core can see of the rendered result |

## Running it

From a clean clone, with Docker running:

```bash
cp .env.example .env   # throwaway local credentials
npm ci
npm run db:up          # waits for SQL Server to accept connections, not just to exist
npm run test:e2e
```

Nothing else needs starting and nothing is left running. Playwright builds the API and launches
the assembly on `:5018`, waiting on `/health` — which is backed by a database check, so it means
*ready to serve a request that touches data*. It builds the client and serves the **production
bundle** through Vite's preview server on `:4173`, which forwards `/api` to the API, so the
browser sees one origin and the API needs no CORS policy at all. Then it runs all three projects
and stops both servers.

That the suite owns the lifecycle is deliberate. Started by hand, each application leaves a
survivor behind — `dotnet run` launches the API as a child process that outlives its parent, and a
held port also locks the assembly, so the next build fails with an error naming a file rather than
the process holding it.

```bash
npm run test:e2e:api      # the browserless tier alone
npm run test:e2e:ui       # the browser tier alone
npm run test:e2e:a11y     # the accessibility scans alone
npm run test:e2e:headed   # the browser tier, visibly
npm run test:e2e:report   # open the report from the last run
npm run lint              # the suite lints itself
npm run typecheck
./scripts/coverage.ps1    # both languages, one merged report
```

The suite runs in about 35 seconds with parallel workers on. It has been checked cold against an
empty database, twice in a row without a reset, and under `--repeat-each=3`.

## How it is built

The reasoning behind each of these is in [docs/test-strategy.md](docs/test-strategy.md). The short
version:

- **Isolation by unique data, not teardown.** The API refuses to delete anything with loan history
  — exactly what the interesting tests create — so cleanup by deletion is impossible for the
  entities that matter, and cleanup by truncation would cost the parallelism. Every spec instead
  creates data nothing else will produce and asserts only on that. Two rules follow: **nothing
  asserts on a count**, and nothing may depend on a pristine database.
- **One narrow door to SQL.** Borrowing stamps its own dates and no endpoint changes them, so an
  overdue loan is unreachable through the API and the alternative is waiting a fortnight. That row
  is inserted directly. One table, one insert, no deletes, no reset.
- **Role- and label-based locators only.** No CSS, and no `data-testid` added to the client, which
  would have meant editing the system under test so the tests could find things.
- **Fixtures over wiring**, so a spec opens with `seed.overdueLoan(6)` rather than four lines that
  add up to one.
- **The rules are enforced, not documented.** The linter rejects `waitForTimeout`, `force: true`,
  a test with no assertion, a page object that imports `expect`, and a spec importing `test` from
  `@playwright/test` instead of from the suite's own fixtures.

### The system under test is not ours to fix

`src/` is a vendored snapshot of two separately published projects, copied in without their git
history so this repository builds and tests end to end from a clean clone.

> **The system under test is modified only to make it observable. It is never modified to make a
> test pass.**

Under that rule the applications have received **exactly one change**: a `/health` endpoint backed
by a database check, so the suite has a readiness signal meaning the database is reachable rather
than merely that the process started. Others were considered and rejected — including one that
would have made an untestable path testable by changing what the software does at startup. They
are recorded with their reasons, because the rejected ones say more than the accepted one.

## Coverage

One report across both languages — Cobertura from coverlet, lcov from v8, merged with
ReportGenerator:

| | Line | Branch |
|---|---|---|
| **Combined** | **46.0%** | **56.7%** |
| `librarysystem-web` (TypeScript) | 80.2% | 61.1% |
| `LibrarySystem.Api` (C#) | 36.2% | 45.5% |

The C# figure is lower than the API is tested, deliberately. Whole controllers read as 0% while
being exercised repeatedly by `tests/api/`, because coverage measures code that ran inside the
*instrumented process* and those tests drive the API as a separate one. Attaching instrumentation
to it is possible and is not done: one number blending "a test asserts something about this line"
with "a test ran past this line" invites exactly the conclusion it cannot support.

Used as a map rather than a score it earned its place — it is what showed the base of the pyramid
was thinner than its green tick suggested.

## Accessibility

Every route is scanned with axe-core at WCAG 2.0/2.1 levels A and AA, plus three states a scan of
a freshly loaded page never sees: a form showing validation errors, a live region announcing a
toast, and a table row midway through a confirmation step. **No violations.**

[docs/accessibility.md](docs/accessibility.md) says what that does and does not mean — roughly a
third of real barriers are detectable this way, and keyboard journeys, whether announcements
arrive usefully, and reflow at 320px are all outside what a rule engine can judge. A clean scan is
a floor, not a certificate.

## Continuous integration

Three jobs, in [.github/workflows/ci.yml](.github/workflows/ci.yml).

`unit` runs both applications' own suites and **does not start the database** — neither needs one,
and the client's suite is timing-sensitive enough that a machine busy running SQL Server costs it
three tests. `e2e` brings the database up from **this repository's own `docker-compose.yml`**
rather than from a service container, so the database tested against locally and the one CI tests
against cannot drift apart, which is the failure this whole project exists to rule out. `report`
merges the coverage and writes the combined figure into the run summary.

The Playwright report, traces, screenshots and videos are kept under `if: always()`, because a
failing run that leaves no evidence is one nobody can debug.

## Layout

```
tests/
  api/         HTTP-level tests, no browser
  ui/          browser flows against the production bundle
  a11y/        axe-core scans
  pages/       page objects - no assertions inside
  components/  BorrowForm, LoanTable, Toast
  fixtures/    the test every spec imports
  support/     builders, uniqueness, the typed client, the SQL escape hatch
docs/          test strategy, accessibility findings, fault-injection results
scripts/       database reset, merged coverage
src/           the system under test - vendored, barely touched
```

## The test database

One compose file defines it, and CI uses that same file.

```powershell
./scripts/db-reset.ps1          # drop it; the next API start rebuilds and reseeds
./scripts/db-reset.ps1 -Hard    # destroy the volume too, for a completely fresh engine
npm run db:down                 # stop the container
```

A reset is almost never needed — the suite is built to pass twice in a row without one, and that
is checked. It exists for the case where a local database is in a state you no longer trust.

To run the API by hand against it:

```bash
dotnet build src/LibrarySystem.Api
export ConnectionStrings__DefaultConnection="Server=localhost,1433;Database=LibrarySystemDb;User Id=sa;Password=LocalTestPassw0rd;TrustServerCertificate=True"
export ASPNETCORE_URLS=http://localhost:5018
dotnet src/LibrarySystem.Api/bin/Debug/net9.0/LibrarySystem.Api.dll
curl http://localhost:5018/health   # Healthy
```

The environment variable wins over the vendored `appsettings.Development.json`, which still points
at SQL Express — environment variables are layered after JSON files in ASP.NET Core's
configuration order, so that file is left exactly as its own project wrote it. The URL has to be
set explicitly, because `launchSettings.json` is read by `dotnet run` and by nothing else.
