import type { ApiClient } from './api'
import type { TestDatabase } from './db'
import { aBook, aLoan, aMember } from './builders'
import { MAX_ACTIVE_LOANS_PER_MEMBER } from './domain'
import type { Book, Loan, Member } from './types'

/**
 * Situations, rather than records.
 *
 * A spec about an overdue loan should begin with an overdue loan, not with four lines that add up
 * to one. Everything here goes through the API wherever the API can express it, and drops to the
 * one direct insert only where it cannot - which is the single case of a loan already past its
 * due date.
 */
export class Scenarios {
  constructor(
    private readonly api: ApiClient,
    private readonly db: TestDatabase,
  ) {}

  /** A book on the shelf, borrowed by nobody. */
  async book(): Promise<Book> {
    return this.api.createBook(aBook().build())
  }

  /** A member holding no loans. */
  async member(): Promise<Member> {
    return this.api.createMember(aMember().build())
  }

  /** A book currently out, with the member who has it and the loan that says so. */
  async borrowedBook(): Promise<{ book: Book; member: Member; loan: Loan }> {
    const book = await this.book()
    const member = await this.member()
    const loan = await this.api.borrow(book.id, member.id)

    return { book, member, loan }
  }

  /** A book that was borrowed and given back, so it has history but is available again. */
  async returnedBook(): Promise<{ book: Book; member: Member; loan: Loan }> {
    const { book, member, loan } = await this.borrowedBook()

    return { book, member, loan: await this.api.returnLoan(loan.id) }
  }

  /**
   * A loan that is late, by however many days the caller wants.
   *
   * The only scenario that needs the database directly: the API dates a loan from the clock and
   * offers no way to change it afterwards, so the alternative is waiting a fortnight.
   */
  async overdueLoan(daysLate = 6): Promise<{ book: Book; member: Member; loan: Loan }> {
    const book = await this.book()
    const member = await this.member()

    const loanId = await this.db.insertLoan(
      aLoan().forBook(book).forMember(member).overdueBy(daysLate).build(),
    )

    return { book, member, loan: await this.api.getLoan(loanId) }
  }

  /** A member holding exactly this many books, for testing either side of the cap. */
  async memberHolding(count: number): Promise<{ member: Member; books: Book[]; loans: Loan[] }> {
    const member = await this.member()
    const books: Book[] = []
    const loans: Loan[] = []

    for (let i = 0; i < count; i++) {
      const book = await this.book()
      books.push(book)
      loans.push(await this.api.borrow(book.id, member.id))
    }

    return { member, books, loans }
  }

  /** A member holding as many books as the rules allow, and one more book they cannot have. */
  async memberAtLoanCap(): Promise<{ member: Member; loans: Loan[]; oneTooMany: Book }> {
    const { member, loans } = await this.memberHolding(MAX_ACTIVE_LOANS_PER_MEMBER)

    return { member, loans, oneTooMany: await this.book() }
  }
}
