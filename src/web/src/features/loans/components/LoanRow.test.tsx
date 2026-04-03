import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../../../test-utils/renderWithProviders'
import LoanRow from './LoanRow'
import type { Loan } from '../../../types/domain'

const activeLoan: Loan = {
  id: 1,
  bookId: 1,
  bookTitle: 'Clean Code',
  memberId: 1,
  memberFullName: 'Alice Johnson',
  borrowedDate: '2025-08-18T00:00:00',
  dueDate: '2025-09-01T00:00:00',
  returnedDate: null,
  isOverdue: true,
}

describe('LoanRow', () => {
  it('renders loan details, an overdue badge, and a return action for active loans', () => {
    renderWithProviders(
      <table>
        <tbody>
          <LoanRow loan={activeLoan} />
        </tbody>
      </table>,
    )

    expect(screen.getByText('Clean Code')).toBeInTheDocument()
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Overdue')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Return' })).toBeInTheDocument()
  })

  it('does not show a return action for returned loans', () => {
    renderWithProviders(
      <table>
        <tbody>
          <LoanRow
            loan={{ ...activeLoan, returnedDate: '2025-08-28T00:00:00', isOverdue: false }}
          />
        </tbody>
      </table>,
    )

    expect(screen.queryByRole('button', { name: 'Return' })).not.toBeInTheDocument()
  })
})
