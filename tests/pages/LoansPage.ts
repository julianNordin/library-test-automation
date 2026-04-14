import type { Locator, Page } from '@playwright/test'
import { BorrowForm } from '../components/BorrowForm'
import { LoanTable } from '../components/LoanTable'
import { Toast } from '../components/Toast'

export type LoanFilter = 'All' | 'Active' | 'Returned' | 'Overdue'

export class LoansPage {
  readonly heading: Locator
  readonly emptyMessage: Locator
  readonly errorMessage: Locator

  readonly borrowForm: BorrowForm
  readonly table: LoanTable
  readonly toast: Toast

  private readonly filters: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Loans', level: 1 })
    this.emptyMessage = page.getByText('No loans match this filter.')
    this.errorMessage = page.getByRole('alert')

    this.borrowForm = new BorrowForm(page)
    this.table = new LoanTable(page)
    this.toast = new Toast(page)

    this.filters = page.getByRole('group', { name: 'Filter loans' })
  }

  async goto(): Promise<this> {
    await this.page.goto('/loans')
    return this
  }

  /**
   * Switch which loans are shown.
   *
   * Worth knowing: three of these filter a list the client already has, and Overdue does not -
   * it asks the API a different question. So this is the one filter whose result depends on the
   * server agreeing.
   */
  async filterBy(filter: LoanFilter): Promise<void> {
    await this.filterButton(filter).click()
  }

  /** The filter buttons carry `aria-pressed`, so which one is chosen is readable, not inferred. */
  filterButton(filter: LoanFilter): Locator {
    return this.filters.getByRole('button', { name: filter, exact: true })
  }

  /** Borrow a book through the form, which is the way a user would do it. */
  async borrow(bookTitle: string, memberName: string): Promise<void> {
    await this.borrowForm.borrow(bookTitle, memberName)
  }
}
