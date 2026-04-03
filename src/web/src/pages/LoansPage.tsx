import { useState } from 'react'
import { useLoans } from '../features/loans/hooks/useLoans'
import { useOverdueLoans } from '../features/loans/hooks/useOverdueLoans'
import LoanTable from '../features/loans/components/LoanTable'
import BorrowForm from '../features/loans/components/BorrowForm'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import styles from './LoansPage.module.css'

type LoanFilter = 'all' | 'active' | 'returned' | 'overdue'

const FILTERS: { value: LoanFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'returned', label: 'Returned' },
  { value: 'overdue', label: 'Overdue' },
]

function LoansPage() {
  const [filter, setFilter] = useState<LoanFilter>('all')

  const loansQuery = useLoans()
  const overdueQuery = useOverdueLoans(filter === 'overdue')

  const isOverdueFilter = filter === 'overdue'
  const isLoading = isOverdueFilter ? overdueQuery.isLoading : loansQuery.isLoading
  const isError = isOverdueFilter ? overdueQuery.isError : loansQuery.isError

  const loans = isOverdueFilter
    ? overdueQuery.data
    : loansQuery.data?.filter((loan) => {
        if (filter === 'active') return loan.returnedDate === null
        if (filter === 'returned') return loan.returnedDate !== null
        return true
      })

  return (
    <div>
      <h1>Loans</h1>
      <BorrowForm />
      <div className={styles.filters} role="group" aria-label="Filter loans">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={filter === value}
            className={filter === value ? styles.filterActive : styles.filter}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading && <Skeleton rows={5} />}
      {isError && <ErrorMessage message="Something went wrong loading loans." />}
      {loans && loans.length === 0 && <EmptyState message="No loans match this filter." />}
      {loans && loans.length > 0 && <LoanTable loans={loans} />}
    </div>
  )
}

export default LoansPage
