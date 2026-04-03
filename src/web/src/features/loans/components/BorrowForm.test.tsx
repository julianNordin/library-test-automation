import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import BorrowForm from './BorrowForm'

const mutate = vi.fn()

vi.mock('../../books/hooks/useBooks', () => ({
  useBooks: () => ({
    data: [
      {
        id: 1,
        title: 'Clean Code',
        author: 'Robert C. Martin',
        isbn: '123',
        publicationYear: 2008,
      },
    ],
  }),
}))

vi.mock('../../members/hooks/useMembers', () => ({
  useMembers: () => ({
    data: [
      { id: 1, fullName: 'Alice Johnson', email: 'alice@example.com', joinedDate: '2024-01-01' },
    ],
  }),
}))

vi.mock('../hooks/useBorrowBook', () => ({
  useBorrowBook: () => ({ mutate, isPending: false, isError: false, error: null }),
}))

describe('BorrowForm', () => {
  it('shows validation errors when submitted with no selections', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BorrowForm />)

    await user.click(screen.getByRole('button', { name: 'Borrow' }))

    expect(await screen.findByText('Please select a book')).toBeInTheDocument()
    expect(screen.getByText('Please select a member')).toBeInTheDocument()
    expect(mutate).not.toHaveBeenCalled()
  })

  it('submits the selected book and member as numbers', async () => {
    const user = userEvent.setup()
    renderWithProviders(<BorrowForm />)

    await user.selectOptions(screen.getByLabelText('Book'), 'Clean Code')
    await user.selectOptions(screen.getByLabelText('Member'), 'Alice Johnson')
    await user.click(screen.getByRole('button', { name: 'Borrow' }))

    expect(mutate).toHaveBeenCalledWith({ bookId: 1, memberId: 1 }, expect.anything())
  })
})
