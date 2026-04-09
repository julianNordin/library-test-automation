// The shapes the API actually returns, mirroring the DTOs in
// src/LibrarySystem.Api/DTOs/. Declared here rather than generated, because three small records
// are not worth an OpenAPI toolchain - and because a hand-written type that disagrees with the
// server is caught by the tests that use it, which is the point of testing over HTTP at all.
//
// Dates arrive as ISO strings; nothing here pretends they are Date objects.
//
// These are type aliases rather than interfaces on purpose: only an alias gets an implicit index
// signature, and without one `expect(created).toMatchObject(built)` does not typecheck.

export type Book = {
  id: number
  title: string
  author: string
  isbn: string
  publicationYear: number
}

export type NewBook = {
  title: string
  author: string
  isbn: string
  publicationYear: number
}

export type Member = {
  id: number
  fullName: string
  email: string
  joinedDate: string
}

export type NewMember = {
  fullName: string
  email: string
}

export type Loan = {
  id: number
  bookId: number
  bookTitle: string
  memberId: number
  memberFullName: string
  borrowedDate: string
  dueDate: string
  returnedDate: string | null
  isOverdue: boolean
}

// A loan as a row rather than as the result of borrowing. The API stamps its own dates, so this
// is only ever built to be inserted directly - see db.ts for why that door exists at all.
export type LoanRow = {
  bookId: number
  memberId: number
  borrowedDate: Date
  dueDate: Date
  returnedDate: Date | null
}

// RFC 7807, as the API writes it. The validation variant carries the per-field dictionary that
// FluentValidation produces; the plain variant is what every domain rule returns.
export type ProblemDetails = {
  type?: string
  title?: string
  status?: number
  detail?: string
}

export type ValidationProblemDetails = ProblemDetails & {
  errors: Record<string, string[]>
}
