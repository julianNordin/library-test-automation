import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import playwright from 'eslint-plugin-playwright'

/**
 * Linting for the test suite only.
 *
 * `src/` is deliberately not linted here. It is a vendored snapshot of two other projects, it
 * carries its own ESLint configuration, and running this one over it would mean this repository
 * passing judgement on code it does not own.
 */
export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      'src/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
    ],
  },

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['tests/**/*.ts', 'playwright.config.ts', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
    },
  },

  // Playwright's own rules, on the specs.
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.spec.ts'],
  },

  {
    files: ['tests/**/*.spec.ts'],
    rules: {
      // The rule this suite is most serious about. `expect(locator)` retries and
      // `expect(value)` does not, and every flaky Playwright suite is built out of closing that
      // gap with a sleep. Writing it down was never going to be enough.
      'playwright/no-wait-for-timeout': 'error',

      // A test with no assertion passes whatever the software does.
      'playwright/expect-expect': 'error',

      // A branch in a test means two tests, one of which is not being run today and nobody
      // knows which.
      'playwright/no-conditional-in-test': 'error',

      // `force: true` clicks something a user could not have clicked, which turns a real
      // accessibility failure into a passing test.
      'playwright/no-force-option': 'error',

      // Left in by accident, either one stops a run dead.
      'playwright/no-page-pause': 'error',
      'playwright/no-focused-test': 'error',

      // Specs take `test` and `expect` from the suite's own fixtures, which is what gives them
      // `seed`, `api` and the page objects. Importing the bare ones silently opts a spec out of
      // all of it, and the failure that follows looks like a missing fixture rather than a
      // wrong import.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['test', 'expect'],
              message:
                "Import { test, expect } from the suite's fixtures instead - tests/fixtures/test.ts - so the spec gets seed, api and the page objects.",
            },
          ],
        },
      ],
    },
  },

  // Page and component objects contain no assertions. Stated in docs/test-strategy.md, enforced
  // here: an assertion inside one of these is invisible to whoever reads the spec that failed.
  {
    files: ['tests/pages/**/*.ts', 'tests/components/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@playwright/test',
              importNames: ['expect'],
              message:
                'Page and component objects expose locators; the spec does the asserting. See docs/test-strategy.md.',
            },
          ],
        },
      ],
    },
  },
)
