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

  /**
   * A success toast, optionally the one carrying a particular message.
   *
   * The message matters more than it looks. Toasts linger for four seconds, so a flow that
   * borrows and then returns has two of them on screen at once - and an unfiltered locator
   * resolving to two elements fails on strict mode, intermittently, depending on how fast the
   * run was. Naming the message asks for the toast the spec actually means.
   */
  success(message?: string): Locator {
    const toasts = this.region.getByRole('status')
    return message === undefined ? toasts : toasts.filter({ hasText: message })
  }

  /** A failure toast. Announced assertively, as `role="alert"`. */
  error(message?: string): Locator {
    const toasts = this.region.getByRole('alert')
    return message === undefined ? toasts : toasts.filter({ hasText: message })
  }

  /** Any toast, whichever kind - for asserting that nothing was announced at all. */
  any(): Locator {
    return this.region.getByRole('status').or(this.region.getByRole('alert'))
  }
}
