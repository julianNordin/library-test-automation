import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BookCard from './BookCard'
import type { Book } from '../../../types/domain'

const book: Book = {
  id: 1,
  title: 'Clean Code',
  author: 'Robert C. Martin',
  isbn: '9780132350884',
  publicationYear: 2008,
}

describe('BookCard', () => {
  it('renders the book title, author, and publication year', () => {
    render(
      <MemoryRouter>
        <BookCard book={book} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Clean Code' })).toHaveAttribute('href', '/books/1')
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument()
    expect(screen.getByText('2008')).toBeInTheDocument()
  })
})
