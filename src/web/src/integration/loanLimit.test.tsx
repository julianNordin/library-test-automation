import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test-utils/renderApp'
import { createLoan } from '../mocks/data'

describe('Loan limit', () => {
  it('blocks borrowing once a member already has 5 active loans', async () => {
    // Alice (member 1) borrows 5 of the 6 seeded books, reaching the cap.
    for (let bookId = 1; bookId <= 5; bookId++) {
      createLoan(bookId, 1)
    }

    const user = userEvent.setup()
    renderApp(['/loans'])

    await screen.findByRole('option', { name: 'Working Effectively with Legacy Code' })
    await user.selectOptions(screen.getByLabelText('Book'), 'Working Effectively with Legacy Code')
    await user.selectOptions(screen.getByLabelText('Member'), 'Alice Johnson')
    await user.click(screen.getByRole('button', { name: 'Borrow' }))

    expect(await screen.findByText('Member 1 already has 5 active loans.')).toBeInTheDocument()
  })
})
