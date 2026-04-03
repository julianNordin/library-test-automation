import type { Book, Loan, Member } from '../types/domain'

export const initialBooks: Book[] = [
  {
    id: 1,
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '9780132350884',
    publicationYear: 2008,
  },
  {
    id: 2,
    title: 'The Pragmatic Programmer',
    author: 'Andrew Hunt',
    isbn: '9780201616224',
    publicationYear: 1999,
  },
  {
    id: 3,
    title: 'Design Patterns',
    author: 'Erich Gamma',
    isbn: '9780201633610',
    publicationYear: 1994,
  },
  {
    id: 4,
    title: 'Domain-Driven Design',
    author: 'Eric Evans',
    isbn: '9780321125217',
    publicationYear: 2003,
  },
  {
    id: 5,
    title: 'Refactoring',
    author: 'Martin Fowler',
    isbn: '9780201485677',
    publicationYear: 1999,
  },
  {
    id: 6,
    title: 'Working Effectively with Legacy Code',
    author: 'Michael Feathers',
    isbn: '9780131177055',
    publicationYear: 2004,
  },
]

export const initialMembers: Member[] = [
  {
    id: 1,
    fullName: 'Alice Johnson',
    email: 'alice@example.com',
    joinedDate: '2024-01-01T00:00:00',
  },
  { id: 2, fullName: 'Bob Smith', email: 'bob@example.com', joinedDate: '2024-02-01T00:00:00' },
]

export const initialLoans: Loan[] = []

export let books: Book[] = []
export let members: Member[] = []
export let loans: Loan[] = []
let nextLoanId = 1

export function resetMockData() {
  books = initialBooks.map((book) => ({ ...book }))
  members = initialMembers.map((member) => ({ ...member }))
  loans = initialLoans.map((loan) => ({ ...loan }))
  nextLoanId = 1
}

export function createLoan(bookId: number, memberId: number): Loan {
  const book = books.find((b) => b.id === bookId)
  const member = members.find((m) => m.id === memberId)
  const now = new Date()
  const due = new Date(now)
  due.setDate(due.getDate() + 14)

  const loan: Loan = {
    id: nextLoanId++,
    bookId,
    bookTitle: book?.title ?? '',
    memberId,
    memberFullName: member?.fullName ?? '',
    borrowedDate: now.toISOString(),
    dueDate: due.toISOString(),
    returnedDate: null,
    isOverdue: false,
  }
  loans.push(loan)
  return loan
}

resetMockData()
