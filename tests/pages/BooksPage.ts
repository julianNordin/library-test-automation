import type { Locator, Page } from '@playwright/test'
import { BookDetailPage } from './BookDetailPage'

export type Availability = 'All' | 'Available' | 'On loan'
export type SortBy = 'Title' | 'Author' | 'Publication year'

export class BooksPage {
  readonly heading: Locator
  readonly searchBox: Locator
  readonly availabilityFilter: Locator
  readonly sortSelect: Locator
  readonly emptyMessage: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Books', level: 1 })
    this.searchBox = page.getByLabel('Search', { exact: true })
    this.availabilityFilter = page.getByLabel('Availability', { exact: true })
    this.sortSelect = page.getByLabel('Sort by', { exact: true })
    this.emptyMessage = page.getByText('No books match your filters.')
    this.errorMessage = page.getByRole('alert')
  }

  async goto(): Promise<this> {
    await this.page.goto('/books')
    return this
  }

  /** A book on the grid, addressed by its title the way a reader would find it. */
  book(title: string): Locator {
    return this.page.getByRole('link', { name: title, exact: true })
  }

  /** Every book title currently shown, in the order they are shown - for sorting. */
  visibleTitles(): Locator {
    return this.page.getByRole('heading', { level: 2 }).getByRole('link')
  }

  async open(title: string): Promise<BookDetailPage> {
    await this.book(title).click()
    return new BookDetailPage(this.page)
  }

  /**
   * Type into the search box. The client debounces this by 250ms, so anything asserted
   * afterwards must be a web-first assertion that retries - which is all of them.
   */
  async searchFor(text: string): Promise<void> {
    await this.searchBox.fill(text)
  }

  async filterByAvailability(availability: Availability): Promise<void> {
    await this.availabilityFilter.selectOption({ label: availability })
  }

  async sortBy(field: SortBy): Promise<void> {
    await this.sortSelect.selectOption({ label: field })
  }
}
