import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import type { Result } from 'axe-core'

/**
 * The rule set every scan in this suite runs.
 *
 * WCAG 2.0 and 2.1, levels A and AA, which is the bar most public-sector and enterprise
 * procurement in Europe actually writes into a contract. Level AAA is deliberately not included:
 * it is not what anybody is held to, and switching it on would fill the report with findings
 * nobody intends to act on - which is how an accessibility report becomes wallpaper.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/**
 * Rules switched off, each with the reason it is off.
 *
 * Empty, and that is worth keeping true. A disabled rule is a decision, and a list of them with
 * no reasons attached is how a scan quietly stops testing anything.
 */
export const DISABLED_RULES: Record<string, string> = {}

export async function scan(page: Page): Promise<Result[]> {
  const builder = new AxeBuilder({ page }).withTags(WCAG_TAGS)

  const disabled = Object.keys(DISABLED_RULES)
  const results = await (disabled.length > 0 ? builder.disableRules(disabled) : builder).analyze()

  return results.violations
}

/**
 * Violations as short readable lines, so a failure says what is wrong and where rather than
 * printing a page of nested JSON that has to be decoded before it can be acted on.
 */
export function summarise(violations: Result[]): string[] {
  return violations.map((violation) => {
    const where = violation.nodes
      .slice(0, 3)
      .map((node) => node.target.join(' '))
      .join(', ')

    return `${violation.id} [${violation.impact ?? 'unknown'}] ${violation.help} - at ${where}`
  })
}
