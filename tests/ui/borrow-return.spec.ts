import { expect, test } from '../fixtures/test'

// The golden path, end to end, in a real browser against a real API and a real SQL Server:
// find a book, look at it, borrow it, watch it become a loan, give it back, and find it on the
// shelf again.
//
// Every assertion here is a web-first one - `expect(locator)`, which retries until the client
// has caught up. Nothing waits for a fixed number of milliseconds, and the linter would not let
// it: `expect(value)` does not retry, and closing that gap with a sleep is how a suite becomes
// flaky. React Query refetches after each mutation, so the moment the DOM settles is the client's
// business rather than this spec's.
test('browse to a book, borrow it, and give it back', async ({
  seed,
  booksPage,
  loansPage,
}) => {
  const book = await seed.book()
  const member = await seed.member()

  // --- browse ---------------------------------------------------------------------------
  const books = await booksPage.goto()
  await expect(books.book(book.title)).toBeVisible()

  const bookDetail = await books.open(book.title)
  await expect(bookDetail.heading).toHaveText(book.title)
  await expect(bookDetail.detail(`ISBN ${book.isbn}`)).toBeVisible()

  // --- borrow ---------------------------------------------------------------------------
  const loans = await loansPage.goto()
  await loans.borrow(book.title, member.fullName)

  await expect(loans.toast.success('Book borrowed successfully.')).toBeVisible()

  await loans.filterBy('Active')
  await expect(loans.table.rowFor(book.title)).toBeVisible()
  await expect(loans.table.cell(book.title, 'Member')).toHaveText(member.fullName)
  await expect(loans.table.cell(book.title, 'Returned')).toHaveText('—')

  // --- return ---------------------------------------------------------------------------
  await loans.table.returnBook(book.title)

  await expect(loans.toast.success('Book returned successfully.')).toBeVisible()

  // The loan moves between the two filters rather than merely gaining a date, which is the part
  // a user would notice and the part a status code alone would not have proven.
  await loans.filterBy('Returned')
  await expect(loans.table.rowFor(book.title)).toBeVisible()
  await expect(loans.table.returnButton(book.title)).toBeHidden()

  await loans.filterBy('Active')
  await expect(loans.table.rowFor(book.title)).toBeHidden()

  // --- and back on the shelf ------------------------------------------------------------
  await books.goto()
  await books.filterByAvailability('Available')
  await expect(books.book(book.title)).toBeVisible()
})

test('shows a book as unavailable while somebody has it', async ({ seed, booksPage }) => {
  const { book } = await seed.borrowedBook()

  const books = await booksPage.goto()

  await books.filterByAvailability('Available')
  await expect(books.book(book.title)).toBeHidden()

  await books.filterByAvailability('On loan')
  await expect(books.book(book.title)).toBeVisible()
})

test('lets a return be thought better of', async ({ seed, loansPage }) => {
  const { book } = await seed.borrowedBook()

  const loans = await loansPage.goto()
  await loans.filterBy('Active')

  await loans.table.startReturnThenCancel(book.title)

  // Cancelling leaves the loan exactly as it was: still active, still returnable, and nothing
  // announced. The last of those is the assertion most likely to be missing, and the one that
  // would catch a confirmation step that fires the mutation before it asks.
  await expect(loans.table.returnButton(book.title)).toBeVisible()
  await expect(loans.toast.any()).toHaveCount(0)
})

test("a member's page shows what they hold and what they gave back", async ({
  seed,
  api,
  memberDetailPage,
}) => {
  const member = await seed.member()
  const kept = await seed.book()
  const given = await seed.book()

  await api.borrow(kept.id, member.id)
  await api.returnLoan((await api.borrow(given.id, member.id)).id)

  const detail = await memberDetailPage.goto(member.id)

  await expect(detail.heading).toHaveText(member.fullName)
  await expect(detail.loanEntry(kept.title)).toContainText('active')
  await expect(detail.loanEntry(given.title)).toContainText('returned')
})
