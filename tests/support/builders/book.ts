import { uniqueIsbn, uniqueTitle } from '../unique'
import type { NewBook } from '../types'

/**
 * A book that the API will accept, with a unique title and ISBN. Override only the field the test
 * is actually about; everything a test does not mention is noise it should not have to write.
 */
class BookBuilder {
  private readonly book: NewBook = {
    title: uniqueTitle(),
    author: 'A. Testwriter',
    isbn: uniqueIsbn(),
    // Comfortably inside the validator's 1450..current-year range, and not a date that says
    // anything about when this suite ran.
    publicationYear: 2020,
  }

  withTitle(title: string): this {
    this.book.title = title
    return this
  }

  withAuthor(author: string): this {
    this.book.author = author
    return this
  }

  withIsbn(isbn: string): this {
    this.book.isbn = isbn
    return this
  }

  withPublicationYear(year: number): this {
    this.book.publicationYear = year
    return this
  }

  build(): NewBook {
    return { ...this.book }
  }
}

export const aBook = (): BookBuilder => new BookBuilder()
