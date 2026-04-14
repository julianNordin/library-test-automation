import type { Locator, Page } from '@playwright/test'

/**
 * The table of loans.
 *
 * Rows are found by the book they are for, rather than by index. An index is a promise that
 * nothing else will ever be inserted above it - which is exactly the promise this suite cannot
 * make, since other specs are creating loans while this one runs.
 */
export class LoanTable {
  private readonly table: Locator

  constructor(private readonly page: Page) {
    this.table = page.getByRole('table')
  }

  /** The row for a given book title. */
  rowFor(bookTitle: string): Locator {
    return this.table
      .getByRole('row')
      .filter({ has: this.page.getByRole('cell', { name: bookTitle, exact: true }) })
  }

  /** Every row currently shown, for asserting that one is absent. */
  rows(): Locator {
    return this.table.getByRole('row')
  }

  /** The overdue marker on a row, which the client renders only when the API says so. */
  overdueBadge(bookTitle: string): Locator {
    return this.rowFor(bookTitle).getByText('Overdue', { exact: true })
  }

  /** The date cell of a row, addressed by the column header it sits under. */
  cell(bookTitle: string, column: 'Book' | 'Member' | 'Borrowed' | 'Due' | 'Returned'): Locator {
    const index = ['Book', 'Member', 'Borrowed', 'Due', 'Returned'].indexOf(column)
    return this.rowFor(bookTitle).getByRole('cell').nth(index)
  }

  /**
   * Give a book back. The client asks for confirmation first, so this is two clicks - and
   * hiding that here is the point: a spec about returning a book should not be a spec about how
   * many times the button has to be pressed.
   */
  async returnBook(bookTitle: string): Promise<void> {
    const row = this.rowFor(bookTitle)
    await row.getByRole('button', { name: 'Return', exact: true }).click()
    await row.getByRole('button', { name: 'Confirm', exact: true }).click()
  }

  /** Start a return and then think better of it. */
  async startReturnThenCancel(bookTitle: string): Promise<void> {
    const row = this.rowFor(bookTitle)
    await row.getByRole('button', { name: 'Return', exact: true }).click()
    await row.getByRole('button', { name: 'Cancel', exact: true }).click()
  }

  returnButton(bookTitle: string): Locator {
    return this.rowFor(bookTitle).getByRole('button', { name: 'Return', exact: true })
  }
}
