# Fault injection

A test suite that has never failed is a claim, not evidence. This is the evidence.

Eight realistic defects were seeded into the system under test, one at a time, on a branch that
was then deleted. Each one is a mistake somebody could plausibly make in an afternoon — not a
deliberately absurd change designed to be caught. After each, every tier was run and the result
recorded: which caught it, and how long until it said so.

## The results

| # | Defect | Where | xUnit (12) | Vitest (21) | `api` (35) | `ui` (29) | `a11y` (10) |
|---|---|---|---|---|---|---|---|
| 1 | Remove the active-loan cap check | API | ✅ 1 | – | ✅ 1 | ✅ 2 | – |
| 2 | Loan period 14 days → 15 | API | ✅ 1 | – | ✅ 2 | ❌ | – |
| 3 | Drop the ISBN validation rule | API | ❌ | – | ✅ 1 | – | – |
| 4 | Narrow the error content-type check | client | – | ✅ 2 | – | ✅ 1 | – |
| 5 | Invert the availability filter | client | – | ✅ 1 | – | ✅ 3 | – |
| 6 | Rename the `overdue` route | API | ❌ | – | ✅ 2 | ✅ 2 | – |
| 7 | Remove a form label | client | – | ✅ 3 | – | ✅ 3 | ✅ 4 |
| 8 | Wrong field in a DTO (`BookTitle` ← author) | API | ❌ | – | ✅ 1 | ✅ 8 | – |

✅ *n* — caught, by that many tests. ❌ — the tier could have seen it and did not.
– — the tier structurally cannot see it: Vitest replaces the API with handlers, xUnit never loads
the client, and the `api` tier never opens a browser.

**Nothing escaped.** Every one of the eight was caught by at least one tier, and five were caught
by more than one.

## Time to a signal

The number that matters is not how long a suite takes but how long until it tells you something.

| Tier | Whole run | What it needs |
|---|---|---|
| xUnit | **~1s** | nothing |
| Vitest | **~8s** | nothing |
| `api` | **~12s** | a database, and both servers started |
| `ui` | **~16s** | the same, plus a browser |
| Everything | **~35s** | the same |

The order is the pyramid, and it is why the pyramid is shaped that way. A defect the unit suites
can catch should be caught there, because a second is a different kind of feedback from forty.
The tiers above exist for what the ones below cannot see — and the table above is a list of
exactly that.

## What the results actually say

### The inherited API suite missed three of the five defects in its own code

Faults 3, 6 and 8 were all in `LibrarySystem.Api`, all plausible, and all invisible to the twelve
xUnit tests that ship with it. Its green tick said nothing about any of them.

That is not a criticism of those tests so much as a measurement of their reach: twelve tests
covering about a third of the API, none of them touching members, and none of them exercising a
route by its URL. It is the same conclusion the coverage figure reached from the other direction,
and it is why the API tier was written as a real tier rather than as a thin smoke layer over
something assumed solid.

### One defect was caught by exactly one tier

**Fault 3 — dropping the ISBN validation rule — was caught only by the `api` tier**, and by a
single test.

The xUnit suite has a validation test, but it asserts on an empty *title*, so a missing ISBN rule
walks straight past it. The browser cannot see it at all: the client has no form for creating a
book, so a rule governing `POST /api/books` is unreachable from the UI. There is exactly one place
in this repository where that defect shows up, which is the clearest answer available to the
question of what an API tier is for.

The test that catches it is the one that asserts the *complete set* of validation error keys
rather than the presence of an error. That distinction is the whole of it: `errors` would still
have contained three entries, and a test checking only that validation failed would have passed.

### The best-defended defect was the one somebody had already made

Fault 4 — narrowing the error content-type check so the API's explanation stops reaching the user
— is caught in both places, and the client's own test for it is named

> `surfaces title and detail from an application/json body, which is what P1 sends`

That test exists because this bug already happened once. What the end-to-end version adds is
independence: the unit test asserts against a handler that a developer changing the API's
content-type would also have to remember to change. The browser test asserts against whatever the
API actually sent. When those two disagree, only one of them is right, and it is not the one
holding a copy of the answer.

### Accessibility regressions are functional regressions here

Fault 7 — removing a `<label>` — failed four accessibility scans *and* three ordinary browser
tests, none of which are about accessibility. Every locator in the suite is a role or a label, so
a control that stops being perceivable also stops being findable.

A suite hung on `data-testid` would have gone on passing while the form became unusable to anyone
not looking at the screen.

### Where a tier deliberately did not look

Fault 2 — a loan period quietly changed from fourteen days to fifteen — was caught by xUnit and by
the API tier, and **not** by the browser tier, which does display the due date.

That is a deliberate non-duplication rather than a gap. Whether the due date is correct is the
API's rule, asserted where the rule lives; what the browser tier is for is whether the user is
shown and told the right things, and it already asserts that the date rendered is the date the API
sent. Re-deriving the arithmetic in the browser would add a second place to update when the rule
changes, and no new information.

## Method

Each defect was applied on its own to a clean tree on a throwaway branch, measured, and reverted
with `git checkout` before the next. The branch was deleted afterwards; none of this reached
`main`.

Two of the eight — fault 4 and fault 7 — were run earlier, at the point the tests claiming to
catch them were written, rather than saved up for this pass. That is the better time to do it: a
regression test whose ability to fail is checked only months later spends those months as a
decoration. Their results were re-measured here against the tiers not covered the first time,
which is how the client's own coverage of both was found.

**No gap was left to close.** Had one of the eight escaped every tier, closing it would have been
this exercise's real output; the table happens to record that none did.
