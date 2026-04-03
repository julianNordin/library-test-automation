import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import ReturnButton from './ReturnButton'

const mutate = vi.fn()
const mockReturnBook = { mutate, isPending: false }

vi.mock('../hooks/useReturnBook', () => ({
  useReturnBook: () => mockReturnBook,
}))

describe('ReturnButton', () => {
  it('asks for confirmation before returning, then calls the mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReturnButton loanId={1} />)

    await user.click(screen.getByRole('button', { name: 'Return' }))
    expect(screen.getByText('Return this book?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(mutate).toHaveBeenCalledWith(1, expect.anything())
  })

  it('lets the user cancel without calling the mutation', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ReturnButton loanId={1} />)

    await user.click(screen.getByRole('button', { name: 'Return' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Return' })).toBeInTheDocument()
  })

  it('disables the confirm and cancel buttons while the mutation is pending', async () => {
    mockReturnBook.isPending = true
    const user = userEvent.setup()
    renderWithProviders(<ReturnButton loanId={1} />)

    await user.click(screen.getByRole('button', { name: 'Return' }))

    expect(screen.getByRole('button', { name: 'Returning…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    mockReturnBook.isPending = false
  })
})
