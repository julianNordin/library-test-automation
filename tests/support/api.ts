import type { APIRequestContext, APIResponse } from '@playwright/test'
import type { Book, Loan, Member, NewBook, NewMember } from './types'

/**
 * A typed client over Playwright's request fixture, for *setup*.
 *
 * Two things follow from that word, and both are deliberate.
 *
 * It throws on any status it did not expect, with the response body in the message. Setup that
 * quietly half-worked produces a failure several assertions later, in a test that looks like it
 * is about something else entirely; failing at the point of the mistake is worth more than a
 * tidy return type.
 *
 * It is therefore *not* how tests assert on failures. A spec checking a 409 or a validation body
 * wants the response, not an exception, and uses `client.raw` - the underlying request context -
 * directly. This client is the shortest path to a book that exists; it is not a wrapper the whole
 * suite has to go through.
 *
 * It works from either project. In the browserless one it talks to the API directly; in the
 * browser one it goes through the preview server's proxy, which forwards to the same API.
 */
export class ApiClient {
  constructor(private readonly request: APIRequestContext) {}

  /** The underlying request context, for tests that need the response rather than the value. */
  get raw(): APIRequestContext {
    return this.request
  }

  // --- books ----------------------------------------------------------------------------

  async createBook(book: NewBook): Promise<Book> {
    const response = await this.request.post('/api/books', { data: book })
    return this.parse<Book>(response, 201, `create book "${book.title}"`)
  }

  async getBook(id: number): Promise<Book> {
    const response = await this.request.get(`/api/books/${id}`)
    return this.parse<Book>(response, 200, `get book ${id}`)
  }

  async listBooks(): Promise<Book[]> {
    const response = await this.request.get('/api/books')
    return this.parse<Book[]>(response, 200, 'list books')
  }

  async updateBook(id: number, book: NewBook): Promise<void> {
    const response = await this.request.put(`/api/books/${id}`, { data: book })
    await this.expectStatus(response, 204, `update book ${id}`)
  }

  async deleteBook(id: number): Promise<void> {
    const response = await this.request.delete(`/api/books/${id}`)
    await this.expectStatus(response, 204, `delete book ${id}`)
  }

  // --- members --------------------------------------------------------------------------

  async createMember(member: NewMember): Promise<Member> {
    const response = await this.request.post('/api/members', { data: member })
    return this.parse<Member>(response, 201, `create member "${member.fullName}"`)
  }

  async getMember(id: number): Promise<Member> {
    const response = await this.request.get(`/api/members/${id}`)
    return this.parse<Member>(response, 200, `get member ${id}`)
  }

  async listMembers(): Promise<Member[]> {
    const response = await this.request.get('/api/members')
    return this.parse<Member[]>(response, 200, 'list members')
  }

  async updateMember(id: number, member: NewMember): Promise<void> {
    const response = await this.request.put(`/api/members/${id}`, { data: member })
    await this.expectStatus(response, 204, `update member ${id}`)
  }

  async deleteMember(id: number): Promise<void> {
    const response = await this.request.delete(`/api/members/${id}`)
    await this.expectStatus(response, 204, `delete member ${id}`)
  }

  // --- loans ----------------------------------------------------------------------------

  async borrow(bookId: number, memberId: number): Promise<Loan> {
    const response = await this.request.post('/api/loans/borrow', { data: { bookId, memberId } })
    return this.parse<Loan>(response, 201, `borrow book ${bookId} for member ${memberId}`)
  }

  async returnLoan(loanId: number): Promise<Loan> {
    const response = await this.request.post(`/api/loans/${loanId}/return`)
    return this.parse<Loan>(response, 200, `return loan ${loanId}`)
  }

  async getLoan(id: number): Promise<Loan> {
    const response = await this.request.get(`/api/loans/${id}`)
    return this.parse<Loan>(response, 200, `get loan ${id}`)
  }

  async listLoans(): Promise<Loan[]> {
    const response = await this.request.get('/api/loans')
    return this.parse<Loan[]>(response, 200, 'list loans')
  }

  async listOverdueLoans(): Promise<Loan[]> {
    const response = await this.request.get('/api/loans/overdue')
    return this.parse<Loan[]>(response, 200, 'list overdue loans')
  }

  async listLoansForMember(memberId: number): Promise<Loan[]> {
    const response = await this.request.get(`/api/loans/member/${memberId}`)
    return this.parse<Loan[]>(response, 200, `list loans for member ${memberId}`)
  }

  // --- plumbing -------------------------------------------------------------------------

  private async parse<T>(response: APIResponse, expected: number, what: string): Promise<T> {
    await this.expectStatus(response, expected, what)
    return (await response.json()) as T
  }

  private async expectStatus(response: APIResponse, expected: number, what: string): Promise<void> {
    if (response.status() === expected) {
      return
    }

    throw new Error(
      `Test setup could not ${what}: expected ${expected}, got ${response.status()} ` +
        `${response.statusText()}\n${await response.text()}`,
    )
  }
}
