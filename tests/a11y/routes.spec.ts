import { expect, test } from '../fixtures/test'
import { summarise } from '../support/a11y'

// Every route the client serves, scanned against WCAG 2.0 and 2.1 at levels A and AA.
//
// What a passing scan means is written out in docs/accessibility.md, and it is less than it
// sounds: automated tooling catches something like a third of the barriers a real user meets.
// These tests are a floor, not a certificate.

test.describe('every route', () => {
  test('the home page', async ({ app, a11yScan }) => {
    await app.goto()
    await expect(app.nav).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('the books page, with books on it', async ({ seed, booksPage, a11yScan }) => {
    const book = await seed.book()
    await booksPage.goto()
    await expect(booksPage.book(book.title)).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('a book detail page', async ({ seed, bookDetailPage, a11yScan }) => {
    const book = await seed.book()
    await bookDetailPage.goto(book.id)
    await expect(bookDetailPage.heading).toHaveText(book.title)

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('the members page', async ({ seed, membersPage, a11yScan }) => {
    const member = await seed.member()
    await membersPage.goto()
    await expect(membersPage.member(member.fullName)).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('a member detail page, with loan history', async ({ seed, memberDetailPage, a11yScan }) => {
    const { member } = await seed.borrowedBook()
    await memberDetailPage.goto(member.id)
    await expect(memberDetailPage.loansHeading).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('the loans page, with a table of loans', async ({ seed, loansPage, a11yScan }) => {
    const { book } = await seed.borrowedBook()
    const loans = await loansPage.goto()
    await loans.filterBy('Active')
    await expect(loans.table.rowFor(book.title)).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('a page that does not exist', async ({ page, a11yScan }) => {
    await page.goto('/no-such-route')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })
})

// The two states a scan of a freshly-loaded page never sees. Both are transient, both are exactly
// where an accessibility problem does the most harm, and neither exists until something has been
// done to the page first.
test.describe('the states a static scan would miss', () => {
  test('the borrow form while it is showing validation errors', async ({
    loansPage,
    a11yScan,
  }) => {
    const loans = await loansPage.goto()
    await loans.borrowForm.submitEmpty()
    await expect(loans.borrowForm.validationError('Please select a book')).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('the notification region while a toast is up', async ({ seed, loansPage, a11yScan }) => {
    const book = await seed.book()
    const member = await seed.member()

    const loans = await loansPage.goto()
    await loans.borrow(book.title, member.fullName)
    await expect(loans.toast.success('Book borrowed successfully.')).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })

  test('a row midway through being returned', async ({ seed, loansPage, a11yScan }) => {
    const { book } = await seed.borrowedBook()

    const loans = await loansPage.goto()
    await loans.filterBy('Active')

    // The confirmation step replaces the button with a question and two more buttons, which is a
    // state the page only reaches by being used.
    await loans.table.returnButton(book.title).click()
    await expect(
      loans.table.rowFor(book.title).getByRole('button', { name: 'Confirm', exact: true }),
    ).toBeVisible()

    expect(summarise(await a11yScan())).toEqual([])
  })
})
