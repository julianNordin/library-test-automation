import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test-utils/renderApp'
import { createLoan } from '../mocks/data'

describe('Return flow', () => {
  it('lets a user return an active loan and updates its status', async () => {
    createLoan(1, 1)

    const user = userEvent.setup()
    renderApp(['/loans'])

    const table = await screen.findByRole('table')
    await user.click(within(table).getByRole('button', { name: 'Return' }))
    await user.click(screen.getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Book returned successfully.')).toBeInTheDocument()
    expect(within(table).queryByRole('button', { name: 'Return' })).not.toBeInTheDocument()
  })
})
