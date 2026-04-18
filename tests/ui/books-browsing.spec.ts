import { expect, test } from '../fixtures/test'
import { aBook } from '../support/builders'
import { uniqueTitle } from '../support/unique'

test.describe('browsing the books page', () => {
  test('searching narrows the list to what matches', async ({ seed, booksPage }) => {
    const wanted = await seed.book()
    const other = await seed.book()

    const books = await booksPage.goto()
    await expect(books.book(wanted.title)).toBeVisible()
    await expect(books.book(other.title)).toBeVisible()

    await books.searchFor(wanted.title)

    // The client debounces typing by 250ms. Nothing here waits for that; both assertions retry
    // until the list settles, which is the difference between a suite that is patient and one
    // that is slow.
    await expect(books.book(wanted.title)).toBeVisible()
    await expect(books.book(other.title)).toBeHidden()
  })

  test('searching by author finds a book by who wrote it', async ({ api, booksPage }) => {
    const author = uniqueTitle('Writer')
    const book = await api.createBook(aBook().withAuthor(author).build())

    const books = await booksPage.goto()
    await books.searchFor(author)

    await expect(books.book(book.title)).toBeVisible()
  })

  test('says so when nothing matches at all', async ({ booksPage }) => {
    const books = await booksPage.goto()

    await books.searchFor(uniqueTitle('Nothing Is Called This'))

    await expect(books.emptyMessage).toBeVisible()
  })

  test('sorts by title, by author and by year', async ({ api, booksPage }) => {
    // Three books sharing a token nothing else has, so searching for it isolates exactly these
    // three. Asserting on the full ordered list is safe here for that reason - the list is
    // entirely of this test's own making, which is the condition the no-counting rule is really
    // about.
    const token = uniqueTitle('Sortable')

    const cormorant = `${token} Cormorant`
    const albatross = `${token} Albatross`
    const bittern = `${token} Bittern`

    await api.createBook(
      aBook().withTitle(cormorant).withAuthor('Zeta Author').withPublicationYear(2001).build(),
    )
    await api.createBook(
      aBook().withTitle(albatross).withAuthor('Mu Author').withPublicationYear(2003).build(),
    )
    await api.createBook(
      aBook().withTitle(bittern).withAuthor('Alpha Author').withPublicationYear(2002).build(),
    )

    const books = await booksPage.goto()
    await books.searchFor(token)

    // Each field puts them in a different order, which is what makes this a test of sorting
    // rather than a test that three books exist.
    await books.sortBy('Title')
    await expect(books.visibleTitles()).toHaveText([albatross, bittern, cormorant])

    await books.sortBy('Author')
    await expect(books.visibleTitles()).toHaveText([bittern, albatross, cormorant])

    await books.sortBy('Publication year')
    await expect(books.visibleTitles()).toHaveText([cormorant, bittern, albatross])
  })

  test('keeps the search and the availability filter working together', async ({
    seed,
    api,
    booksPage,
  }) => {
    const token = uniqueTitle('Paired')

    const onShelf = await api.createBook(aBook().withTitle(`${token} Shelved`).build())
    const lent = await api.createBook(aBook().withTitle(`${token} Lent`).build())
    const member = await seed.member()
    await api.borrow(lent.id, member.id)

    const books = await booksPage.goto()
    await books.searchFor(token)
    await books.filterByAvailability('Available')

    await expect(books.book(onShelf.title)).toBeVisible()
    await expect(books.book(lent.title)).toBeHidden()
  })
})
