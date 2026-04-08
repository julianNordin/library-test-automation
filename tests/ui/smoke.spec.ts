import { expect, test } from '@playwright/test'
import { SEEDED_BOOK_TITLES } from '../support/seed'

// The whole stack in one assertion: a real browser loads the production bundle, the bundle asks
// for /api/books on its own origin, the preview server forwards that to the API, and the API
// answers out of SQL Server. Every one of those has to be right for a title to appear.
//
// Locators are role-based rather than CSS or a test id. The client's markup is already
// accessible enough to address that way, so the suite can be written against what a user sees
// instead of against class names that are free to change.
test('the books page lists the seeded titles', async ({ page }) => {
  await page.goto('/books')

  await expect(page.getByRole('heading', { name: 'Books', level: 1 })).toBeVisible()

  for (const title of SEEDED_BOOK_TITLES) {
    await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible()
  }
})
