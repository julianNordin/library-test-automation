import { expect, test } from '@playwright/test'
import { ApiClient } from '../support/api'
import { aBook, aMember } from '../support/builders'
import { expectProblem, expectValidationProblem } from '../support/problem'
import { uniqueIsbn } from '../support/unique'
import type { Book } from '../support/types'

test.describe('books over HTTP', () => {
  test('creates a book and hands back where to find it', async ({ request }) => {
    const api = new ApiClient(request)
    const built = aBook().build()

    const response = await api.raw.post('/api/books', { data: built })

    expect(response.status()).toBe(201)

    const created = (await response.json()) as Book
    expect(created).toMatchObject(built)

    // 201 without a Location header tells a client something exists but not where, which is the
    // half of `CreatedAtAction` that is easy to lose and hard to notice.
    const location = response.headers()['location']
    expect(location).toContain(`/api/books/${created.id}`)

    expect(await api.getBook(created.id)).toEqual(created)
  })

  test('lists a book once it exists', async ({ request }) => {
    const api = new ApiClient(request)
    const created = await api.createBook(aBook().build())

    // Present, not counted: other specs are creating books at this very moment.
    const titles = (await api.listBooks()).map((book) => book.title)
    expect(titles).toContain(created.title)
  })

  test('updates a book in place', async ({ request }) => {
    const api = new ApiClient(request)
    const created = await api.createBook(aBook().build())

    const revised = { ...aBook().build(), isbn: created.isbn }
    await api.updateBook(created.id, revised)

    expect(await api.getBook(created.id)).toEqual({ id: created.id, ...revised })
  })

  test('deletes a book that was never borrowed', async ({ request }) => {
    const api = new ApiClient(request)
    const created = await api.createBook(aBook().build())

    await api.deleteBook(created.id)

    expect((await api.raw.get(`/api/books/${created.id}`)).status()).toBe(404)
  })

  test('refuses a duplicate ISBN', async ({ request }) => {
    const api = new ApiClient(request)
    const isbn = uniqueIsbn()
    await api.createBook(aBook().withIsbn(isbn).build())

    const response = await api.raw.post('/api/books', { data: aBook().withIsbn(isbn).build() })

    const problem = await expectProblem(response, 409, 'Duplicate value')
    expect(problem.detail).toContain(isbn)
  })

  test('refuses a book that fails validation, and says which fields', async ({ request }) => {
    const api = new ApiClient(request)

    const response = await api.raw.post('/api/books', { data: {} })

    const problem = await expectValidationProblem(response)

    // Keyed by the CLR property name, so PascalCase - not the camelCase the same fields are
    // serialised with everywhere else in the API. A client mapping errors back onto its form
    // fields has to know that, so the suite states it rather than leaving it to be discovered.
    expect(Object.keys(problem.errors).sort()).toEqual([
      'Author',
      'Isbn',
      'PublicationYear',
      'Title',
    ])
  })

  test('refuses a publication year outside the accepted range', async ({ request }) => {
    const api = new ApiClient(request)

    const response = await api.raw.post('/api/books', {
      data: aBook().withPublicationYear(1200).build(),
    })

    const problem = await expectValidationProblem(response)
    expect(Object.keys(problem.errors)).toEqual(['PublicationYear'])
  })

  test('refuses to delete a book with loan history', async ({ request }) => {
    const api = new ApiClient(request)
    const book = await api.createBook(aBook().build())
    const member = await api.createMember(aMember().build())
    const loan = await api.borrow(book.id, member.id)

    // Returning it does not help: the history is what blocks the delete, not the open loan.
    await api.returnLoan(loan.id)

    const problem = await expectProblem(
      await api.raw.delete(`/api/books/${book.id}`),
      409,
      'Delete conflict',
    )
    expect(problem.detail).toContain('loan history')

    // And the refusal is real, not merely reported.
    expect((await api.getBook(book.id)).id).toBe(book.id)
  })

  test('answers 404 for an id that does not exist', async ({ request }) => {
    const api = new ApiClient(request)
    const missing = 2_000_000_000

    expect((await api.raw.get(`/api/books/${missing}`)).status()).toBe(404)
    expect((await api.raw.delete(`/api/books/${missing}`)).status()).toBe(404)
    expect(
      (await api.raw.put(`/api/books/${missing}`, { data: aBook().build() })).status(),
    ).toBe(404)
  })
})
