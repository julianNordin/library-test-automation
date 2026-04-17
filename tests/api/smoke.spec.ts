import { expect, test } from '../fixtures/test'
import { SEEDED_BOOK_TITLES } from '../support/seed'

interface BookReadDto {
  id: number
  title: string
  author: string
  isbn: string
  publicationYear: number
}

// The browserless project's first test, and the proof that it is wired up: it reaches the API at
// this project's base URL with no page, no bundle and no proxy in between. What comes back has
// been through a real controller and a real SQL Server, which is the difference between this
// tier and the API's own in-process suite.
test('the API serves the seeded books over HTTP', async ({ api }) => {
  const response = await api.raw.get('/api/books')

  expect(response.status()).toBe(200)

  const books = (await response.json()) as BookReadDto[]

  expect(books.map((book) => book.title)).toEqual(
    expect.arrayContaining([...SEEDED_BOOK_TITLES]),
  )
})
