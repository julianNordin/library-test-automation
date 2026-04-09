import { expect, test } from '@playwright/test'
import { ApiClient } from '../support/api'
import { TestDatabase } from '../support/db'
import { aBook, aLoan, aMember } from '../support/builders'
import { LOAN_PERIOD_DAYS } from '../support/domain'
import { daysBetween, parseApiDate } from '../support/dates'

// Tests of the test data, which is not as circular as it sounds. Everything the rest of this
// suite asserts is built on these four claims: that the builders produce values the API accepts,
// that two of them never collide, that a directly-inserted overdue loan really is overdue, and
// that a loan borrowed the ordinary way is not. If any of those is quietly false, later specs
// fail for reasons that have nothing to do with what they are testing - or worse, pass.

test.describe('the test data machinery', () => {
  test('builds a book the API accepts', async ({ request }) => {
    const api = new ApiClient(request)

    const built = aBook().build()
    const created = await api.createBook(built)

    expect(created).toMatchObject(built)
    expect(created.id).toBeGreaterThan(0)
  })

  test('builds a member the API accepts', async ({ request }) => {
    const api = new ApiClient(request)

    const built = aMember().build()
    const created = await api.createMember(built)

    expect(created).toMatchObject(built)
    expect(created.joinedDate).not.toBeNull()
  })

  test('builds values that do not collide with each other', async ({ request }) => {
    const api = new ApiClient(request)

    // Both unique columns at once. A duplicate ISBN or email is a 409, so this passing at all is
    // the assertion - and it is the property the whole parallel strategy rests on.
    await api.createBook(aBook().build())
    await api.createBook(aBook().build())
    await api.createMember(aMember().build())
    await api.createMember(aMember().build())
  })

  test('inserts a loan that is genuinely overdue', async ({ request }) => {
    const api = new ApiClient(request)
    const db = new TestDatabase()

    try {
      const book = await api.createBook(aBook().build())
      const member = await api.createMember(aMember().build())

      const row = aLoan().forBook(book).forMember(member).overdueBy(6).build()
      const loanId = await db.insertLoan(row)

      const loan = await api.getLoan(loanId)

      // The row came back as the instant it was written with. The API stores and compares UTC,
      // so a driver sending the machine's local time would shift every loan inserted here by the
      // local offset - invisible against a six-day margin, and decisive at any boundary. This is
      // what holds that behaviour in place; a whole hour is thousands of times this tolerance.
      expect(
        Math.abs(parseApiDate(loan.borrowedDate).getTime() - row.borrowedDate.getTime()),
      ).toBeLessThan(1000)

      // The API decides this itself, from the dates it read back out of SQL Server.
      expect(loan.isOverdue).toBe(true)
      expect(loan.returnedDate).toBeNull()
      expect(daysBetween(loan.borrowedDate, loan.dueDate)).toBe(LOAN_PERIOD_DAYS)

      // ...and it reaches the query the client's Overdue filter actually uses.
      const overdue = await api.listOverdueLoans()
      expect(overdue.map((l) => l.id)).toContain(loanId)
    } finally {
      await db.close()
    }
  })

  test('leaves a normally borrowed loan not overdue', async ({ request }) => {
    const api = new ApiClient(request)

    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())
    const loan = await api.borrow(book.id, member.id)

    // The control for the test above. Without it, `isOverdue: true` might mean the flag is simply
    // always true, and the overdue assertion would prove nothing at all.
    expect(loan.isOverdue).toBe(false)
    expect(daysBetween(loan.borrowedDate, loan.dueDate)).toBe(LOAN_PERIOD_DAYS)
  })
})
