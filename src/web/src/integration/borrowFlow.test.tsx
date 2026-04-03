import { describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test-utils/renderApp'

describe('Borrow flow', () => {
  it('lets a user borrow an available book and see it appear in the loan table', async () => {
    const user = userEvent.setup()
    renderApp(['/loans'])

    await screen.findByRole('option', { name: 'Clean Code' })
    await user.selectOptions(screen.getByLabelText('Book'), 'Clean Code')
    await user.selectOptions(screen.getByLabelText('Member'), 'Alice Johnson')
    await user.click(screen.getByRole('button', { name: 'Borrow' }))

    expect(await screen.findByText('Book borrowed successfully.')).toBeInTheDocument()

    const table = await screen.findByRole('table')
    expect(within(table).getByText('Clean Code')).toBeInTheDocument()
    expect(within(table).getByText('Alice Johnson')).toBeInTheDocument()
  })
})
