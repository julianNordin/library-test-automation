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

```bash
dotnet test                       # the API's xUnit suite, from the repository root
cd src/web && npm ci && npm test  # the client's Vitest suite
```

## Status

Early. The stack under test is in place and both inherited suites are green; the test suite
itself is not written yet.
