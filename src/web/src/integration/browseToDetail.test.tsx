import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../test-utils/renderApp'

describe('Browse to book detail', () => {
  it('lets a user open a book from the list and see its details', async () => {
    const user = userEvent.setup()
    renderApp(['/books'])

    const link = await screen.findByRole('link', { name: 'Clean Code' })
    await user.click(link)

    expect(await screen.findByRole('heading', { name: 'Clean Code' })).toBeInTheDocument()
    expect(screen.getByText('ISBN 9780132350884')).toBeInTheDocument()
  })
})
