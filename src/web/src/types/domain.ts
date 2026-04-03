export interface Book {
  id: number
  title: string
  author: string
  isbn: string
  publicationYear: number
}

export interface Member {
  id: number
  fullName: string
  email: string
  joinedDate: string
}

export interface Loan {
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

export interface BorrowRequest {
  bookId: number
  memberId: number
}
