import type { Locator, Page } from '@playwright/test'

/**
 * The notification region, and the only place the suite looks for a toast.
 *
 * Scoping matters here. The page's loading indicators are also `role="status"` and its inline
 * error messages are also `role="alert"`, so an unscoped `getByRole('alert')` would sometimes
 * find a form error and sometimes a toast, depending on timing. The region has an accessible
 * name for exactly this reason, and using it is what makes these locators mean one thing.
 */
export class Toast {
  private readonly region: Locator

  constructor(page: Page) {
    this.region = page.getByRole('region', { name: 'Notifications' })
  }

  /** A success toast. The client announces these politely, as `role="status"`. */
  success(): Locator {
    return this.region.getByRole('status')
  }

  /** A failure toast. Announced assertively, as `role="alert"`. */
  error(): Locator {
    return this.region.getByRole('alert')
  }

  /** Any toast, whichever kind - for asserting that nothing was announced at all. */
  any(): Locator {
    return this.region.getByRole('status').or(this.region.getByRole('alert'))
  }
}
