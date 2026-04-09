import { LOAN_PERIOD_DAYS, daysAgo } from '../domain'
import type { Book, LoanRow, Member } from '../types'

/**
 * A loan as a *row*, for inserting directly.
 *
 * Borrowing through the API produces the only loan the API can produce: borrowed now, due in
 * fourteen days, not returned. This builder exists for the loans it cannot - principally an
 * overdue one, which is otherwise fourteen days away. See db.ts for why that door exists and how
 * narrow it is kept.
 *
 * Every date here is computed from the current time. Nothing is ever written as a literal date,
 * which would rot the moment the suite was run on another day.
 */
class LoanBuilder {
  private bookId = 0
  private memberId = 0
  private borrowedAgo = 0
  private returnedAgo: number | null = null

  forBook(book: Book | number): this {
    this.bookId = typeof book === 'number' ? book : book.id
    return this
  }

  forMember(member: Member | number): this {
    this.memberId = typeof member === 'number' ? member : member.id
    return this
  }

  /** Borrowed this many days ago, and so due back {@link LOAN_PERIOD_DAYS} days after that. */
  borrowedDaysAgo(days: number): this {
    this.borrowedAgo = days
    return this
  }

  /**
   * Late by this many days: still out, and due back that long ago. A loan overdue by six days was
   * borrowed twenty days ago, which is the arithmetic this saves every spec from restating.
   */
  overdueBy(days: number): this {
    this.borrowedAgo = LOAN_PERIOD_DAYS + days
    this.returnedAgo = null
    return this
  }

  /** Already given back, this many days ago. */
  returnedDaysAgo(days: number): this {
    this.returnedAgo = days
    return this
  }

  build(): LoanRow {
    if (this.bookId <= 0 || this.memberId <= 0) {
      // A row with a zero foreign key fails on insert with a constraint error that names a
      // column, not the mistake. Say what is actually wrong instead.
      throw new Error(
        'aLoan() needs both forBook() and forMember() before it can be built - a loan row ' +
          'has no meaning without the book and the member it joins.',
      )
    }

    const borrowedDate = daysAgo(this.borrowedAgo)

    return {
      bookId: this.bookId,
      memberId: this.memberId,
      borrowedDate,
      dueDate: daysAgo(this.borrowedAgo - LOAN_PERIOD_DAYS),
      returnedDate: this.returnedAgo === null ? null : daysAgo(this.returnedAgo),
    }
  }
}

export const aLoan = (): LoanBuilder => new LoanBuilder()
