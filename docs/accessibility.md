# Accessibility

What was scanned, what was found, and — more usefully — what a clean result does not mean.

## What is scanned

`@axe-core/playwright`, against **WCAG 2.0 and 2.1, levels A and AA**. Ten scans run as their own
Playwright project:

| Scanned | Why it is on the list |
|---|---|
| Home, books, book detail, members, member detail, loans, and the not-found page | Every route the client serves |
| The books page with books on it, the loans page with a table of loans | An empty page is an easy page; the components only exist once there is data |
| The borrow form showing validation errors | A message a user cannot perceive is not a message |
| The notification region with a toast in it | Announcements are exactly where a live region either works or silently does not |
| A loan row midway through being returned | The confirmation step replaces a button with a question and two more, and only exists once the page has been used |

The last three matter most and are the ones a scan of a freshly loaded page never reaches. None of
those states exists until something has been done to the page first, and transient states are
where accessibility work is most often skipped.

## What was found

**No violations.** Every route and every state passes at A and AA.

That result is worth exactly as much as the scan's ability to fail, so that was checked rather
than assumed: with the `Book` label removed from the borrow form, four scans fail with

```
select-name [critical] Select element must have an accessible name - at #borrow-book
```

The label was restored. A scan nobody has watched fail is a decoration.

### The same defect broke the functional tests too

Worth recording, because it was a claim this project made before it had evidence. Removing that
label also failed the browsing, borrowing and business-rule specs, all of them stuck on
`getByLabel('Book')`.

That is the argument for role- and label-based locators paying off in a direction people do not
usually expect. Because the suite addresses the client the way a user perceives it, **an
accessibility regression is a functional failure**, caught by tests that were never about
accessibility. A suite hung on `data-testid` would have gone on passing perfectly while the form
became unusable to anyone not looking at it.

## What a clean result does not mean

It does not mean the client is accessible. Automated tooling detects on the order of **a third**
of the barriers real users meet — axe-core's own documentation is direct about this — and the
third it detects is the mechanical third.

What this scan cannot see, and what an actual audit would cover:

- **Keyboard-only use.** Whether every control can be reached and operated in a sensible order,
  whether focus is visible throughout, and where focus lands after the borrow form submits or a
  row collapses back from its confirmation step. Axe checks that elements are *focusable*; it has
  no opinion on whether the resulting journey makes sense.
- **Screen reader output.** Whether the announcements are *useful*. The toast region is correctly
  marked up as a live region — that much is mechanical — but whether "Book borrowed successfully."
  arrives at a helpful moment, and whether the loan table's rows read coherently cell by cell, is
  not something a rule engine can judge.
- **Reflow and zoom.** Behaviour at 200% and at 320px, where a table is most likely to become
  unusable.
- **Cognitive load and clarity of language**, which no tool assesses at all.

Passing here is a floor. It is a real floor — the mechanical failures are genuinely absent — but
publishing it as a compliance claim would be dishonest, and a green badge saying otherwise would
be worth less than this paragraph.

## Configuration

Both decisions are in `tests/support/a11y.ts`, next to the code they affect.

**Level AAA is not included.** It is not the bar anyone is held to in practice, and switching it on
would fill the report with findings nobody intends to act on — which is how an accessibility
report turns into wallpaper.

**No rules are disabled.** `DISABLED_RULES` is an empty map that exists to be read: it takes a
reason alongside each rule, so a rule can only be switched off by someone willing to write down
why. A list of disabled rules with no reasons attached is how a scan quietly stops testing
anything.

## Changes to the client

**None were needed**, which resolved a tension worth naming rather than glossing over.

This repository holds that the system under test is modified only to make it observable, never to
make a test pass. An accessibility fix sits awkwardly against that, because it is a genuine
improvement to the product rather than an accommodation for a test — but it is still this project
changing software it does not own.

Had anything been found, the intent was to record it here with a reproduction and leave the fix to
the project that owns the client, rather than to quietly improve someone else's application inside
a test repository. Nothing was found, so the question stayed theoretical. It is written down
because the next person to run these scans against a changed client will meet it for real.
