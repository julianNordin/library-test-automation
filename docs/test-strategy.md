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

## Isolation by unique data

Every test in this suite runs against the same database, at the same time as every other test,
and none of them cleans up after itself. That is a decision, not an omission.

### Why not the usual answers

**Reset between tests.** Dropping and reseeding between tests is the most thorough answer and it
costs the suite its parallelism: workers sharing a database cannot take turns wiping it. The run
becomes serial, and a serial end-to-end suite is one nobody waits for.

**Roll back a transaction.** The standard trick for in-process integration tests — open a
transaction, run the code, roll back — needs the test and the code under test to share a
connection. Here they do not share a *process*. The API has its own pool, and work the suite
never committed is work the API cannot see. The technique does not survive the leap to testing
over HTTP, which is worth saying out loud because it is the first thing people reach for.

**Delete what you created.** This one fails on the domain rather than the plumbing. The API
refuses, by design, to delete a book or a member with any loan history, and answers `409`. Loan
history is exactly what the interesting tests create, so teardown by deletion is impossible for
precisely the entities that matter. Any suite that relied on it would work until its tests got
interesting.

### What is done instead

Each spec creates data nothing else will produce, asserts only on that data, and leaves it
behind. Uniqueness comes from three things that cannot all coincide: the run, the worker process,
and the call.

Two rules follow, and the whole suite obeys them:

> **Nothing asserts on a count, or on a list length.** What else is in the database is the
> business of runs that came before, and none of it is this test's concern. Even the smoke test
> checks that the five seeded titles are *present*, never that there are five books.

> **Nothing depends on a pristine database.** The suite must pass twice in a row without a reset.
> If it does not, something in it is quietly relying on being first.

The database therefore grows as it is used. It is a container with a disposable volume, and
`npm run db:down` is the reset — for the rare case where one is wanted at all, rather than as
part of the loop.

### The one place the suite talks to SQL

Setup otherwise goes through the API, because a test that builds its world through a back door is
testing a world the application cannot reach. One state defeats that.

Borrowing stamps the borrowed and due dates from the clock, and no endpoint changes either
afterwards. An **overdue loan is unreachable through the API**, and the only alternative is
waiting fourteen days. That row is written directly.

The exception is kept the width of its justification: one table, one insert, no deletes and no
reset. A `TRUNCATE` behind that door would not be a convenience, it would be the isolation
strategy above being quietly replaced by a different one.

## Timestamps arrive without an offset

The API stores UTC. The `DateTime` values it reads back out of SQL Server have an `Unspecified`
kind, and `System.Text.Json` serialises those with no trailing `Z`:

```json
"borrowedDate": "2026-04-17T19:13:17.921"
```

JavaScript reads a date-time string carrying no offset as **local** time, so the obvious
`new Date(loan.borrowedDate)` is wrong by the reader's own offset — two hours on the machine this
was written on, and none at all on a UTC runner. A defect that appears on some machines and not
others is the kind that gets filed as flakiness and retried until it goes away, so the suite
parses these explicitly instead.

Nothing is changed in the API for it. The timestamps are ambiguous, not incorrect, and
reformatting them would alter a response that existing clients already read — which is the rule
at the top of this document, applied to a case where breaking it would have been easy to justify.

It is worth noticing what that ambiguity costs the client, though, because it is the sort of thing
neither project could find alone: the client renders these values with `new Date(...)` too, so a
loan due shortly before midnight UTC displays a day late to a reader east of it. Whether a loan is
*overdue* is decided by the API and is unaffected. The disagreement is only ever about which day a
timestamp is called.

## The API tier, and why the API already having tests is not an objection

The API ships its own integration tests, and they are good ones: they drive real controllers
through `WebApplicationFactory`, in process, against the Entity Framework in-memory provider.
The obvious question about the tier described here is what it adds.

It adds the two things that harness replaces with a stand-in: **the wire, and the database.**

Over the wire, this tier sees what a client sees — the status code, the headers, the serialised
body. That is where a `Location` header either exists or does not, and where a `ProblemDetails`
body turns out to be labelled `application/json` rather than `application/problem+json`, which
matters because the client decides whether an error is worth parsing by reading that header.

The database is the larger gap, because **several of this domain's rules are not enforced in C# at
all.** Duplicate ISBN and duplicate email are refused only because SQL Server rejects the insert
and the service translates the resulting `DbUpdateException` into a `409`. The in-memory provider
does not enforce a unique index — checked directly rather than assumed — so neither rule can
fire under it, and the inherited suite covers neither. Refusing to delete a book with loan
history has the same shape, resting on a restricted foreign key.

So the rules most worth having tests for are precisely the ones the in-process suite cannot
reach. That is not a criticism of it. It is the reason this tier exists, and the reason it is not
duplication.

### What it found

Two disagreements, both real, both invisible from either side alone.

**The same timestamp is serialised two different ways.** `POST /api/members` returns
`"joinedDate": "2026-04-17T19:13:17.921Z"`. `GET` of that same member returns
`"2026-04-17T19:13:17.921"`, with no `Z`. The created value is the entity still in memory, whose
`DateTime` has a UTC kind; the fetched one has been through a `datetime2` column, which has no
concept of a kind. The instants agree and the strings do not — and the in-memory provider hands
back the original object, so the two responses are identical there and the difference cannot
appear.

**There are two different 404 bodies.** A controller answering `NotFound()` produces ASP.NET's
stock problem document, with a `type` and a `traceId` and no `detail`. A 404 raised as an
exception is built by the API's own handler, which sets `detail` and neither of the others. A
client cannot rely on `detail` being present on a 404.

Neither is fixed here, and neither is a bug this project is entitled to close — see the rule at
the top of this document. Both are pinned by a test that says plainly that it is characterising
current behaviour rather than endorsing it, so a future change to either shows up as a failure
that has to be read, rather than as a silent change to a published contract.

## Page objects, and the three rules they follow

The browser tier addresses the client through objects in `tests/pages/` and `tests/components/`
rather than through locators written in the specs. Three rules shape them, and each one is there
to prevent a specific way this layer usually rots.

### Locators are roles and labels, never CSS and never a test id

`getByRole('button', { name: 'Borrow' })` and `getByLabel('Book')` address the page the way a
person does. A class name is an implementation detail that is free to change and takes the suite
with it when it does.

The alternative — sprinkling `data-testid` through the client — would have meant **editing the
system under test so that the tests could find things**, which the rule at the top of this
document does not allow. Nothing was added. The client's markup was already accessible enough to
address this way, and that is worth noticing in both directions: the accessibility work already
in the client is what made this suite's locators possible, and a suite written this way keeps
that accessibility honest, because a heading that stops being a heading breaks a test.

One case shows why the rule needs care rather than obedience. The client uses `role="status"` for
its loading indicators *and* for success toasts, and `role="alert"` for inline form errors *and*
for failure toasts. An unscoped `getByRole('alert')` would find different things depending on
timing — the classic intermittent failure. The notification region carries an accessible name, so
the toast object scopes to it and the ambiguity disappears without touching the client.

### They expose intent, and hand back where you end up

`loans.table.returnBook(title)` is two clicks, because the client asks for confirmation. A spec
about returning a book should not also be a spec about how many times a button has to be pressed;
if that flow gains a step, one method changes and no spec does.

Navigation methods return the object for the page you land on, so taking a wrong turn is a
compile error rather than a puzzling failure thirty lines later.

Rows are found by what they contain, never by index. An index is a promise that nothing will ever
be inserted above it — exactly the promise this suite cannot make, since other specs are creating
loans while any given one runs.

### They contain no assertions

Page objects return locators; specs assert on them. An assertion hidden inside a page object is
one that nobody reading the spec can see, and it makes a failure point at a helper instead of at
the behaviour that broke.

It also keeps every web-first assertion in the spec, where its retrying is visible. That
distinction is the single most important thing about writing Playwright well, and burying half of
it in a helper is how a suite starts needing sleeps.

Both rules are checked mechanically rather than by good intentions: no `expect(` and no raw
selector appears anywhere under `tests/pages/` or `tests/components/`.

## Fixtures, and the difference between worker-scoped and test-scoped

Every spec takes `test` and `expect` from `tests/fixtures/test.ts` rather than from
`@playwright/test`, and gets `api`, `db`, `seed` and the page objects already built. The aim is
narrow: a spec's first line should be the situation it is about, not four lines of wiring that
every other spec also has.

`seed` is deliberately a factory of *situations* rather than of records — `seed.overdueLoan(3)`,
`seed.memberAtLoanCap()`. A spec about the loan cap should begin with a member at their cap, not
with a loop that adds up to one.

The scoping is worth reading, because the two cases are decided on opposite grounds and the
usual shorthand — "worker-scope the expensive things" — gets one of them wrong.

**`db` is worker-scoped because it is expensive and holds nothing.** Opening a connection pool
per test would dominate the run. What makes that safe is not the cost but the contents: the pool
holds sockets, and there is nothing in it a later test could learn from an earlier one.

**`api` is test-scoped even though building it is free, because of what it wraps.** Playwright
gives each test a fresh `request` context; sharing one across tests would share cookies and
connection state between them. That is exactly the leak between tests this suite is built to rule
out, and it would have been introduced in the name of an optimisation worth nothing.

So the question is not "is this expensive" but **"could a later test see something an earlier one
did"** — and only when the answer is no does cost get a vote.

The page objects are test-scoped of necessity: each wraps `page`.

### The rules are enforced, not merely written down

A convention that lives in a document is one that a hurried afternoon quietly repeals. The suite
lints itself, and the rules it cares about most are the ones that fail silently rather than
loudly:

| Rule | Why it is switched on |
|---|---|
| `no-restricted-imports` on `test`/`expect` | A spec importing the bare `test` still runs — it simply has no `seed`, `api` or page objects, and the failure reads as a missing fixture rather than a wrong import. |
| `playwright/no-wait-for-timeout` | The single most common cause of a flaky Playwright suite. `expect(locator)` retries and `expect(value)` does not, and a sleep is what people reach for when they meet that difference. |
| `playwright/expect-expect` | A test with no assertion passes whatever the software does. It caught one in this suite the day it was switched on. |
| `playwright/no-conditional-in-test` | A branch in a test is two tests, one of which is not running today and nobody knows which. |
| `playwright/no-force-option` | `force: true` clicks what a user could not have clicked, turning a real accessibility defect into a passing test. |
| `no-restricted-imports` on `expect` in page objects | Enforces the rule stated above — objects expose locators, specs assert. |

`src/` is not linted here. It is vendored, it has its own configuration, and this repository has
no business passing judgement on code it does not own.

## Web-first assertions, and why there is not a single sleep

There is exactly one thing to understand about writing Playwright well, and every flaky suite is
built out of not understanding it:

> `expect(locator)` **retries**. `expect(value)` **does not**.

`await expect(page.getByRole('row')).toBeVisible()` re-evaluates until the row is there or the
timeout runs out. `expect(await rows.count()).toBe(3)` reads a number once, at whatever instant
the test happened to reach that line, and compares it. The second one fails whenever the machine
is a little slow — and the fix that suggests itself is a sleep, which turns a fast failing test
into a slow passing one without changing anything about the race underneath.

So this suite never waits for a number of milliseconds. It waits for the page to say something.
The client refetches after every mutation and debounces its search box by 250ms; when the DOM
settles is the client's business, and every assertion here is written to be patient about it
rather than to guess.

That is not left to discipline. `playwright/no-wait-for-timeout` is an error, so a sleep cannot
reach a commit even on an afternoon when it would be convenient.

### The one place a list is counted

The sorting test asserts an exact ordered list of three titles, which looks like the counting the
isolation doctrine forbids. It is allowed for a specific reason: the three books share a token
nothing else in the database has, and the search box narrows the page to exactly them. The list
being counted is entirely of that test's own making.

The rule was never "never count". It is **never depend on what other runs left behind**, and a
list you created in full is not that.

It also has to be an ordered assertion for the test to mean anything. The three books are
arranged so that title, author and publication year each put them in a *different* order, so no
one expected sequence could be satisfied by a sort that had quietly stopped working.

## The same rule at two tiers, and why that is not duplication

Every business rule in this system is asserted twice: once at the API tier and once through the
browser. They are not the same assertion written twice.

**The API test proves the rule holds.** A member at their cap is refused; the response is a `409`
whose body explains why.

**The browser test proves the person is told.** A rule that is enforced correctly and then
reported to the user as the word "Conflict" has failed at the only place it was ever for.

That second sentence is not hypothetical, and the test that carries it is the most valuable one in
this repository. The API builds its error bodies as problem documents but writes them with
`WriteAsJsonAsync`, which labels them `application/json` rather than `application/problem+json`.
The client only parses an error body it recognises as JSON. Narrow that check to the more specific
type — a change that looks like a tightening, and that every unit test in both projects would
still pass — and the client goes on working perfectly: the request still fails, the red toast
still appears, and every explanation inside it is replaced by the bare status text.

The test was checked by doing exactly that. With the check narrowed, the toast reads:

```html
<p role="alert" class="toast error">Conflict</p>
```

The assertion is therefore written to insist on the sentence — `already on loan` — and not merely
on the presence of an error. **An assertion that only checks that something went wrong cannot
tell the difference between a message and a shrug.**

### Where a rule is only testable at one tier

Two of this domain's rules are asserted at the API tier alone, and that is a finding rather than
a gap: **the client has no user interface for either of them.** It issues only `GET` and `POST`.

- *Deleting a book or a member with loan history* — nothing in the client deletes anything.
- *Returning a loan that was already returned* — the return button is rendered only for a loan
  that is still out.

Reaching either through the browser would mean building a situation no user can reach, and a test
that contorts itself into an impossible state is evidence about a system nobody ships. They are
covered where they are real, and the reason is written here instead of a test being invented to
fill the row.
