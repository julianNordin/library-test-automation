import { expect, test } from '../fixtures/test'
import { MAX_ACTIVE_LOANS_PER_MEMBER } from '../support/domain'

// The rules that make this more than a form over a table, checked where a user meets them.
//
// Each of these is also asserted at the API tier, and that is not duplication: the API test
// proves the rule holds, and this one proves the person is told. A rule that is enforced and
// then reported as "Conflict" has failed at the only place it was for.

test.describe('the rules, as a user meets them', () => {
  test('refuses to lend a book somebody already has, and says why', async ({
    seed,
    loansPage,
  }) => {
    const { book } = await seed.borrowedBook()
    const hopeful = await seed.member()

    const loans = await loansPage.goto()
    await loans.borrow(book.title, hopeful.fullName)

    // This is the assertion the whole phase is for.
    //
    // The API sends a 409 whose `detail` says what went wrong. The client reads that only if it
    // recognises the response as JSON - and the API labels these bodies `application/json`
    // rather than `application/problem+json`. A content-type check narrowed to the more specific
    // type still leaves the client working, still shows a red toast, and silently replaces every
    // explanation with the bare status text.
    //
    // So it is not enough to assert that an error appeared. The test has to insist on the
    // sentence.
    await expect(loans.toast.error()).toContainText('already on loan')
    await expect(loans.toast.error()).not.toContainText('Conflict')
  })

  test('stops a member at five books, in the words of the rule', async ({ seed, loansPage }) => {
    const { member, oneTooMany } = await seed.memberAtLoanCap()

    const loans = await loansPage.goto()
    await loans.borrow(oneTooMany.title, member.fullName)

    await expect(loans.toast.error()).toContainText('5 active loans')

    // Refused, not merely complained about.
    await loans.filterBy('Active')
    await expect(loans.table.rowFor(oneTooMany.title)).toBeHidden()
  })

  test('lets a member take their last allowed book, and only then refuses', async ({
    seed,
    loansPage,
  }) => {
    // Both sides of the boundary, which is the whole point of a boundary.
    //
    // The test above notices an off-by-one as well, but only by accident and badly: its setup
    // borrows five books, so a cap of four makes the *scenario* throw. That failure reads as
    // broken test data and sends whoever sees it looking through the suite. Checked by moving
    // the cap to four and running both.
    //
    // This one fails on an assertion instead, and names the side of the boundary that moved.
    const { member } = await seed.memberHolding(MAX_ACTIVE_LOANS_PER_MEMBER - 1)
    const lastAllowed = await seed.book()
    const oneTooMany = await seed.book()

    const loans = await loansPage.goto()

    await loans.borrow(lastAllowed.title, member.fullName)
    await expect(loans.toast.success('Book borrowed successfully.')).toBeVisible()

    await loans.borrow(oneTooMany.title, member.fullName)
    await expect(loans.toast.error()).toContainText('5 active loans')
  })

  test('marks a late loan as overdue on its row', async ({ seed, loansPage }) => {
    const { book } = await seed.overdueLoan(6)

    const loans = await loansPage.goto()
    await loans.filterBy('All')

    await expect(loans.table.overdueBadge(book.title)).toBeVisible()
  })

  test('asks the server which loans are overdue', async ({ page, seed, loansPage }) => {
    const { book } = await seed.overdueLoan(9)

    const loans = await loansPage.goto()

    // Three of the four filters sieve a list the client already holds. Overdue does not - it
    // asks a different question of the API, which is the only one of the four whose answer the
    // client could not work out for itself. Asserting the request happens is what tells the two
    // kinds of filter apart from the outside.
    const [response] = await Promise.all([
      page.waitForResponse((r) => r.url().includes('/api/loans/overdue')),
      loans.filterBy('Overdue'),
    ])

    expect(response.status()).toBe(200)
    await expect(loans.table.rowFor(book.title)).toBeVisible()
    await expect(loans.table.overdueBadge(book.title)).toBeVisible()
  })

  test("shows a late loan as overdue on the member's own page", async ({
    seed,
    memberDetailPage,
  }) => {
    const { book, member } = await seed.overdueLoan(5)

    // The member page renders three states from one expression - returned, overdue, active - and
    // the middle one is reachable only through a loan the API cannot create.
    const detail = await memberDetailPage.goto(member.id)

    await expect(detail.loanEntry(book.title)).toContainText('overdue')
  })

  test('drops a loan off the overdue list once it is given back', async ({ seed, loansPage }) => {
    const { book } = await seed.overdueLoan(4)

    const loans = await loansPage.goto()
    await loans.filterBy('Overdue')
    await expect(loans.table.rowFor(book.title)).toBeVisible()

    await loans.table.returnBook(book.title)
    await expect(loans.toast.success('Book returned successfully.')).toBeVisible()

    // Still past its due date, and no longer overdue: the question is about books that are out,
    // not about lateness in the abstract.
    await expect(loans.table.rowFor(book.title)).toBeHidden()
  })
})
