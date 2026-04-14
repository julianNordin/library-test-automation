import type { Locator, Page } from '@playwright/test'

/**
 * The borrow form on the loans page.
 *
 * Both fields are addressed by their visible label, which is what a user reads and what a screen
 * reader announces. Nothing here knows a class name or an element id.
 */
export class BorrowForm {
  readonly heading: Locator
  readonly bookSelect: Locator
  readonly memberSelect: Locator
  readonly submitButton: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Borrow a book' })
    this.bookSelect = page.getByLabel('Book', { exact: true })
    this.memberSelect = page.getByLabel('Member', { exact: true })
    this.submitButton = page.getByRole('button', { name: 'Borrow', exact: true })
  }

  /** Choose a book and a member and submit - the whole intent in one call. */
  async borrow(bookTitle: string, memberName: string): Promise<void> {
    await this.bookSelect.selectOption({ label: bookTitle })
    await this.memberSelect.selectOption({ label: memberName })
    await this.submitButton.click()
  }

  /** Submit without choosing anything, to reach the client's own validation. */
  async submitEmpty(): Promise<void> {
    await this.submitButton.click()
  }

  /** The validation messages the form shows for itself, before any request is made. */
  validationErrors(): Locator {
    return this.page.getByRole('alert')
  }
}
