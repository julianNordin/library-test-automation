import type { Locator, Page } from '@playwright/test'

export class BookDetailPage {
  readonly heading: Locator
  readonly notFoundMessage: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 })
    this.notFoundMessage = page.getByRole('alert')
    this.errorMessage = page.getByRole('alert')
  }

  async goto(bookId: number): Promise<this> {
    await this.page.goto(`/books/${bookId}`)
    return this
  }

  /** The author, ISBN and year, as the page writes them. */
  detail(text: string): Locator {
    return this.page.getByText(text, { exact: true })
  }
}
