import type { Locator, Page } from '@playwright/test'
import { Toast } from '../components/Toast'
import { BooksPage } from './BooksPage'
import { LoansPage } from './LoansPage'
import { MembersPage } from './MembersPage'

/**
 * The shell every page is rendered inside: the navigation and the notification region.
 */
export class AppLayout {
  readonly nav: Locator
  readonly toast: Toast

  constructor(private readonly page: Page) {
    this.nav = page.getByRole('navigation', { name: 'Main navigation' })
    this.toast = new Toast(page)
  }

  async goto(): Promise<this> {
    await this.page.goto('/')
    return this
  }

  navLink(name: 'Library' | 'Books' | 'Members' | 'Loans'): Locator {
    return this.nav.getByRole('link', { name, exact: true })
  }

  async goToBooks(): Promise<BooksPage> {
    await this.navLink('Books').click()
    return new BooksPage(this.page)
  }

  async goToMembers(): Promise<MembersPage> {
    await this.navLink('Members').click()
    return new MembersPage(this.page)
  }

  async goToLoans(): Promise<LoansPage> {
    await this.navLink('Loans').click()
    return new LoansPage(this.page)
  }
}
