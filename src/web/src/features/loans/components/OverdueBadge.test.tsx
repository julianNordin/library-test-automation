import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import OverdueBadge from './OverdueBadge'

describe('OverdueBadge', () => {
  it('renders an overdue label', () => {
    render(<OverdueBadge />)
    expect(screen.getByText('Overdue')).toBeInTheDocument()
  })
})
