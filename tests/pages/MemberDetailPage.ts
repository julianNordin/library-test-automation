import type { Locator, Page } from '@playwright/test'

export class MemberDetailPage {
  readonly heading: Locator
  readonly loansHeading: Locator
  readonly emptyMessage: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 })
    this.loansHeading = page.getByRole('heading', { name: 'Loans', level: 2 })
    this.emptyMessage = page.getByText('This member has no loans yet.')
    this.errorMessage = page.getByRole('alert')
  }

  async goto(memberId: number): Promise<this> {
    await this.page.goto(`/members/${memberId}`)
    return this
  }

  detail(text: string): Locator {
    return this.page.getByText(text, { exact: true })
  }

  /** One entry in this member's loan history, found by the book it is for. */
  loanEntry(bookTitle: string): Locator {
    return this.page.getByRole('listitem').filter({ hasText: bookTitle })
  }
}
