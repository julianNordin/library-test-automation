import { expect, test } from '../fixtures/test'
import { SEEDED_BOOK_TITLES } from '../support/seed'

// What the client does when things go wrong, or when there is nothing to show.
//
// Three of these put the system into a state it would be difficult or slow to reach for real, by
// intercepting the browser's requests. That is a deliberate and bounded exception to how the rest
// of this suite works, and the boundary is worth stating: interception is used to create a
// *situation* the real stack cannot easily be put in - a dead API, a slow network, an empty
// database - and never to change what the API would answer in a test claiming to be end to end.
// It is the same argument as the one direct SQL insert, arriving from the other side.

test.describe('when things go wrong', () => {
  test('will not submit an empty borrow form', async ({ loansPage }) => {
    const loans = await loansPage.goto()

    await loans.borrowForm.submitEmpty()

    await expect(loans.borrowForm.validationError('Please select a book')).toBeVisible()
    await expect(loans.borrowForm.validationError('Please select a member')).toBeVisible()

    // The client stopped it: nothing was announced, which is what would fail if the form
    // submitted first and validated afterwards.
    await expect(loans.toast.any()).toHaveCount(0)
  })

  test('clears a validation message once the field is filled in', async ({ seed, loansPage }) => {
    const book = await seed.book()
    const member = await seed.member()

    const loans = await loansPage.goto()
    await loans.borrowForm.submitEmpty()
    await expect(loans.borrowForm.validationError('Please select a book')).toBeVisible()

    await loans.borrow(book.title, member.fullName)

    await expect(loans.borrowForm.validationError('Please select a book')).toBeHidden()
    await expect(loans.toast.success('Book borrowed successfully.')).toBeVisible()

    // And this is what makes the `toHaveCount(0)` in the test above mean anything: the same
    // locator, in a situation where there *is* something to find, finds it. A locator that can
    // never match would satisfy a count of zero for the wrong reason entirely.
    await expect(loans.toast.any()).toHaveCount(1)
  })

  test('says the book is missing rather than showing an empty page', async ({
    bookDetailPage,
  }) => {
    const detail = await bookDetailPage.goto(2_000_000_000)

    await expect(detail.notFoundMessage).toHaveText('This book could not be found.')
  })

  test('says the member is missing rather than showing an empty page', async ({
    memberDetailPage,
  }) => {
    const detail = await memberDetailPage.goto(2_000_000_000)

    await expect(detail.errorMessage).toHaveText('This member could not be found.')
  })

  test('says so when a member has never borrowed anything', async ({
    seed,
    memberDetailPage,
  }) => {
    const member = await seed.member()

    const detail = await memberDetailPage.goto(member.id)

    await expect(detail.heading).toHaveText(member.fullName)
    await expect(detail.emptyMessage).toBeVisible()
  })

  test('tells the reader when the API cannot be reached at all', async ({ page, booksPage }) => {
    const seeded = SEEDED_BOOK_TITLES[0]

    // Load it working first. That is not scene-setting: it is what makes the disappearance below
    // an assertion rather than a coincidence. "No books are shown" and "the locator was wrong"
    // look identical from the outside, and only the line above tells them apart.
    const books = await booksPage.goto()
    await expect(books.book(seeded)).toBeVisible()

    // The backend keeps running; this browser simply cannot reach it. Taking the real API down
    // would exercise the same branch and would take every other test in the run with it.
    await page.route('**/api/**', (route) => route.abort())
    await page.reload()

    await expect(books.errorMessage).toHaveText('Something went wrong loading books.')
    await expect(books.book(seeded)).toBeHidden()
  })

  test('says so when there are no loans to show', async ({ page, loansPage }) => {
    // An empty database is a state this suite can never reach - it does not clean up, by design -
    // so the empty branch is unreachable without help. The response shape is the API's own, an
    // empty list, rather than an invented one.
    await page.route('**/api/loans', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )

    const loans = await loansPage.goto()

    await expect(loans.emptyMessage).toBeVisible()
  })

  test('shows a loading state before the book arrives', async ({ page, seed, bookDetailPage }) => {
    const book = await seed.book()

    // Holding the response open is what makes this assertable at all: without it the request
    // finishes in milliseconds and whether the spinner is ever caught depends on how quick the
    // machine was. This is not the sleep the suite forbids - that one guesses at how long the
    // application needs and hopes. This one controls the timing rather than betting on it, and
    // the assertion still retries.
    await page.route(`**/api/books/${book.id}`, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      await route.continue()
    })

    const detail = bookDetailPage.goto(book.id)

    await expect(page.getByRole('status')).toHaveText('Loading book…')

    await detail
    await expect(bookDetailPage.heading).toHaveText(book.title)
  })
})
