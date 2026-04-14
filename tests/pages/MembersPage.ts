import type { Locator, Page } from '@playwright/test'
import { MemberDetailPage } from './MemberDetailPage'

export class MembersPage {
  readonly heading: Locator
  readonly emptyMessage: Locator
  readonly errorMessage: Locator

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Members', level: 1 })
    this.emptyMessage = page.getByText('No members yet.')
    this.errorMessage = page.getByRole('alert')
  }

  async goto(): Promise<this> {
    await this.page.goto('/members')
    return this
  }

  member(fullName: string): Locator {
    return this.page.getByRole('link', { name: fullName, exact: true })
  }

  async open(fullName: string): Promise<MemberDetailPage> {
    await this.member(fullName).click()
    return new MemberDetailPage(this.page)
  }
}
