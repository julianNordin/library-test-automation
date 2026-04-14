import { expect, test } from '@playwright/test'
import { BooksPage } from '../pages'
import { SEEDED_BOOK_TITLES } from '../support/seed'

// The whole stack in one assertion: a real browser loads the production bundle, the bundle asks
// for /api/books on its own origin, the preview server forwards that to the API, and the API
// answers out of SQL Server. Every one of those has to be right for a title to appear.
//
// Written through a page object, which is what the rest of the browser tier does. The locators
// live in one place, they are role-based, and this spec says what it is checking rather than how
// to find it.
test('the books page lists the seeded titles', async ({ page }) => {
  const books = await new BooksPage(page).goto()

  await expect(books.heading).toBeVisible()

  for (const title of SEEDED_BOOK_TITLES) {
    await expect(books.book(title)).toBeVisible()
  }
})
