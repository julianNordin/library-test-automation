import { expect, test } from '../fixtures/test'
import { aBook, aMember } from '../support/builders'
import { LOAN_PERIOD_DAYS, MAX_ACTIVE_LOANS_PER_MEMBER } from '../support/domain'
import { daysBetween, parseApiDate } from '../support/dates'
import { expectProblem, expectValidationProblem } from '../support/problem'
import type { Loan } from '../support/types'

test.describe('loans over HTTP', () => {
  test('borrows a book and dates the loan from now', async ({ api }) => {
    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())

    const response = await api.raw.post('/api/loans/borrow', {
      data: { bookId: book.id, memberId: member.id },
    })

    expect(response.status()).toBe(201)

    const loan = (await response.json()) as Loan
    expect(response.headers()['location']).toContain(`/api/loans/${loan.id}`)

    expect(loan).toMatchObject({
      bookId: book.id,
      bookTitle: book.title,
      memberId: member.id,
      memberFullName: member.fullName,
      returnedDate: null,
      isOverdue: false,
    })

    // The rule the API implements, restated rather than imported: fourteen days, from now.
    expect(daysBetween(loan.borrowedDate, loan.dueDate)).toBe(LOAN_PERIOD_DAYS)
    expect(Math.abs(parseApiDate(loan.borrowedDate).getTime() - Date.now())).toBeLessThan(60_000)
  })

  test('refuses to lend a book that is already out', async ({ api }) => {
    const book = await api.createBook(aBook().build())
    const first = await api.createMember(aMember().build())
    const second = await api.createMember(aMember().build())

    await api.borrow(book.id, first.id)

    const problem = await expectProblem(
      await api.raw.post('/api/loans/borrow', { data: { bookId: book.id, memberId: second.id } }),
      409,
      'Book not available',
    )
    expect(problem.detail).toContain(String(book.id))
  })

  test('returns a book and frees it to be borrowed again', async ({ api }) => {
    const book = await api.createBook(aBook().build())
    const first = await api.createMember(aMember().build())
    const second = await api.createMember(aMember().build())

    const loan = await api.borrow(book.id, first.id)
    const returned = await api.returnLoan(loan.id)

    expect(returned.id).toBe(loan.id)
    expect(returned.returnedDate).not.toBeNull()
    expect(returned.isOverdue).toBe(false)

    // The point of returning it, and the half of the rule a status code alone would not prove.
    const next = await api.borrow(book.id, second.id)
    expect(next.memberId).toBe(second.id)
  })

  test('refuses to return the same loan twice', async ({ api }) => {
    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())

    const loan = await api.borrow(book.id, member.id)
    await api.returnLoan(loan.id)

    const problem = await expectProblem(
      await api.raw.post(`/api/loans/${loan.id}/return`),
      409,
      'Loan already returned',
    )
    expect(problem.detail).toContain(String(loan.id))
  })

  test('stops a member at their active-loan cap', async ({ api, seed }) => {
    const { member, loans, oneTooMany } = await seed.memberAtLoanCap()

    const problem = await expectProblem(
      await api.raw.post('/api/loans/borrow', {
        data: { bookId: oneTooMany.id, memberId: member.id },
      }),
      409,
      'Loan limit exceeded',
    )
    expect(problem.detail).toContain(String(MAX_ACTIVE_LOANS_PER_MEMBER))

    // The cap counts active loans, not loans ever made: give one back and the next is allowed.
    await api.returnLoan(loans[0]!.id)
    await api.borrow(oneTooMany.id, member.id)
  })

  test('reports a loan past its due date as overdue', async ({ api, seed }) => {
    const { loan } = await seed.overdueLoan(3)

    expect(loan.isOverdue).toBe(true)
    expect((await api.listOverdueLoans()).map((l) => l.id)).toContain(loan.id)

    // Returning it takes it off the overdue list even though it is still past its due date -
    // the query is about books that are still out, not about lateness in the abstract.
    await api.returnLoan(loan.id)

    expect((await api.getLoan(loan.id)).isOverdue).toBe(false)
    expect((await api.listOverdueLoans()).map((l) => l.id)).not.toContain(loan.id)
  })

  test('lists only the loans belonging to one member', async ({ api }) => {
    const mine = await api.createMember(aMember().build())
    const theirs = await api.createMember(aMember().build())

    const myLoan = await api.borrow((await api.createBook(aBook().build())).id, mine.id)
    const theirLoan = await api.borrow((await api.createBook(aBook().build())).id, theirs.id)

    const ids = (await api.listLoansForMember(mine.id)).map((l) => l.id)

    expect(ids).toContain(myLoan.id)
    expect(ids).not.toContain(theirLoan.id)
  })

  test('answers 404 when borrowing against something that is not there', async ({ api }) => {
    const missing = 2_000_000_000
    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())

    const noBook = await expectProblem(
      await api.raw.post('/api/loans/borrow', { data: { bookId: missing, memberId: member.id } }),
      404,
      'Resource not found',
    )
    expect(noBook.detail).toContain(`Book ${missing}`)

    const noMember = await expectProblem(
      await api.raw.post('/api/loans/borrow', { data: { bookId: book.id, memberId: missing } }),
      404,
      'Resource not found',
    )
    expect(noMember.detail).toContain(`Member ${missing}`)

    await expectProblem(
      await api.raw.post(`/api/loans/${missing}/return`),
      404,
      'Resource not found',
    )
  })

  test('refuses a borrow request that is not even well formed', async ({ api }) => {
    const problem = await expectValidationProblem(
      await api.raw.post('/api/loans/borrow', { data: { bookId: 0, memberId: 0 } }),
    )

    expect(Object.keys(problem.errors).sort()).toEqual(['BookId', 'MemberId'])
  })

  test('produces two different 404 bodies, depending on what produced them', async ({ api }) => {
    const missing = 2_000_000_000

    // Characterising the API as it is. A controller answering NotFound() itself gets ASP.NET's
    // stock body - a type link and a traceId, and no detail saying what was missing. A 404
    // raised as an exception is built by the API's own handler instead, which fills in detail
    // and neither of the other two.
    //
    // A client cannot rely on detail being present on a 404, and this is the test that says so
    // out loud rather than letting every caller discover it separately.
    const fromController = await (await api.raw.get(`/api/books/${missing}`)).json()
    const fromHandler = await (
      await api.raw.post('/api/loans/borrow', { data: { bookId: missing, memberId: missing } })
    ).json()

    expect(fromController).toMatchObject({ status: 404, title: 'Not Found' })
    expect(fromController).toHaveProperty('traceId')
    expect(fromController).not.toHaveProperty('detail')

    expect(fromHandler).toMatchObject({ status: 404, title: 'Resource not found' })
    expect(fromHandler).toHaveProperty('detail')
    expect(fromHandler).not.toHaveProperty('traceId')
  })
})
