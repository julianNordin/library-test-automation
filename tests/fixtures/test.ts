import { test as base } from '@playwright/test'
import { ApiClient } from '../support/api'
import { TestDatabase } from '../support/db'
import { Scenarios } from '../support/scenarios'
import {
  AppLayout,
  BookDetailPage,
  BooksPage,
  LoansPage,
  MemberDetailPage,
  MembersPage,
} from '../pages'

/**
 * The `test` every spec in this suite imports, so a spec can open with the scenario it is about
 * instead of four lines of wiring. An ESLint rule keeps it that way.
 *
 * The scoping is the part worth reading, because the two cases are decided on different grounds.
 */
type Fixtures = {
  api: ApiClient
  seed: Scenarios
  app: AppLayout
  booksPage: BooksPage
  bookDetailPage: BookDetailPage
  membersPage: MembersPage
  memberDetailPage: MemberDetailPage
  loansPage: LoansPage
}

type WorkerFixtures = {
  db: TestDatabase
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  /**
   * Worker-scoped, because a connection pool is expensive to open and holds nothing a later test
   * could learn from an earlier one - only sockets. One pool per worker, opened on first use and
   * closed when the worker finishes.
   */
  db: [
    // Playwright requires the argument even for a fixture that depends on nothing.
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      const db = new TestDatabase()
      await use(db)
      await db.close()
    },
    { scope: 'worker' },
  ],

  /**
   * Test-scoped, and not because it is cheap to build. It wraps the `request` fixture, which
   * Playwright gives a fresh context per test; sharing one across tests would share cookies and
   * connection state, which is precisely the leak between tests this suite exists to rule out.
   */
  api: async ({ request }, use) => {
    await use(new ApiClient(request))
  },

  seed: async ({ api, db }, use) => {
    await use(new Scenarios(api, db))
  },

  // The page objects, test-scoped of necessity: each one wraps `page`, which is per test.
  app: async ({ page }, use) => {
    await use(new AppLayout(page))
  },

  booksPage: async ({ page }, use) => {
    await use(new BooksPage(page))
  },

  bookDetailPage: async ({ page }, use) => {
    await use(new BookDetailPage(page))
  },

  membersPage: async ({ page }, use) => {
    await use(new MembersPage(page))
  },

  memberDetailPage: async ({ page }, use) => {
    await use(new MemberDetailPage(page))
  },

  loansPage: async ({ page }, use) => {
    await use(new LoansPage(page))
  },
})

// Re-exported so a spec needs one import line, and so that taking `expect` from
// `@playwright/test` is a lint error in the same way that taking `test` from it is.
export { expect } from '@playwright/test'
