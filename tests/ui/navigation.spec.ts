import { expect, test } from '../fixtures/test'

test.describe('moving around the client', () => {
  test('reaches every main page from the navigation', async ({ app }) => {
    await app.goto()

    await expect(app.nav).toBeVisible()

    await expect((await app.goToBooks()).heading).toBeVisible()
    await expect((await app.goToMembers()).heading).toBeVisible()
    await expect((await app.goToLoans()).heading).toBeVisible()
  })

  test('opens a book from the grid and shows what the API holds', async ({ booksPage, seed }) => {
    const book = await seed.book()

    const books = await booksPage.goto()
    const detail = await books.open(book.title)

    // Everything asserted here came out of SQL Server, through the API, through the proxy and
    // into the DOM. The setup used the API rather than a form, because this spec is about the
    // detail page and not about how books get created.
    await expect(detail.heading).toHaveText(book.title)
    await expect(detail.detail(book.author)).toBeVisible()
    await expect(detail.detail(`ISBN ${book.isbn}`)).toBeVisible()
    await expect(detail.detail(`Published ${book.publicationYear}`)).toBeVisible()
  })

  test('opens a member and shows the loans they hold', async ({ membersPage, seed }) => {
    const { book, member } = await seed.borrowedBook()

    const members = await membersPage.goto()
    const detail = await members.open(member.fullName)

    await expect(detail.heading).toHaveText(member.fullName)
    await expect(detail.detail(member.email)).toBeVisible()
    await expect(detail.loanEntry(book.title)).toContainText('active')
  })

  test('says so when a book id leads nowhere', async ({ bookDetailPage }) => {
    const detail = await bookDetailPage.goto(2_000_000_000)

    await expect(detail.notFoundMessage).toHaveText('This book could not be found.')
  })
})
