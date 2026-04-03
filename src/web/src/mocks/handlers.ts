import { http, HttpResponse } from 'msw'
import { books, createLoan, loans, members } from './data'

const MAX_ACTIVE_LOANS = 5

// Mirrors P1's GlobalExceptionHandler: it builds an RFC 7807 ProblemDetails but writes it
// with WriteAsJsonAsync, so the real content type is `application/json`. Do not "fix" this
// to `application/problem+json` — that mismatch previously hid a bug in apiClient.
function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ status, title, detail }, { status })
}

export const handlers = [
  http.get('/api/books', () => HttpResponse.json(books)),

  http.get('/api/books/:id', ({ params }) => {
    const book = books.find((b) => b.id === Number(params.id))
    if (!book) return problem(404, 'Resource not found', `Book ${params.id} was not found.`)
    return HttpResponse.json(book)
  }),

  http.get('/api/members', () => HttpResponse.json(members)),

  http.get('/api/members/:id', ({ params }) => {
    const member = members.find((m) => m.id === Number(params.id))
    if (!member) return problem(404, 'Resource not found', `Member ${params.id} was not found.`)
    return HttpResponse.json(member)
  }),

  http.get('/api/loans', () => HttpResponse.json(loans)),

  http.get('/api/loans/overdue', () => HttpResponse.json(loans.filter((loan) => loan.isOverdue))),

  http.get('/api/loans/member/:memberId', ({ params }) =>
    HttpResponse.json(loans.filter((loan) => loan.memberId === Number(params.memberId))),
  ),

  http.post('/api/loans/borrow', async ({ request }) => {
    const { bookId, memberId } = (await request.json()) as { bookId: number; memberId: number }

    const bookHasActiveLoan = loans.some(
      (loan) => loan.bookId === bookId && loan.returnedDate === null,
    )
    if (bookHasActiveLoan) {
      return problem(409, 'Book not available', `Book ${bookId} is already on loan.`)
    }

    const activeLoanCount = loans.filter(
      (loan) => loan.memberId === memberId && loan.returnedDate === null,
    ).length
    if (activeLoanCount >= MAX_ACTIVE_LOANS) {
      return problem(
        409,
        'Loan limit exceeded',
        `Member ${memberId} already has ${MAX_ACTIVE_LOANS} active loans.`,
      )
    }

    const loan = createLoan(bookId, memberId)
    return HttpResponse.json(loan, { status: 201 })
  }),

  http.post('/api/loans/:id/return', ({ params }) => {
    const loan = loans.find((l) => l.id === Number(params.id))
    if (!loan) return problem(404, 'Resource not found', `Loan ${params.id} was not found.`)
    if (loan.returnedDate !== null) {
      return problem(409, 'Loan already returned', `Loan ${params.id} was already returned.`)
    }
    loan.returnedDate = new Date().toISOString()
    return HttpResponse.json(loan)
  }),
]
