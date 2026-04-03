import type { Loan } from '../../../types/domain'
import LoanRow from './LoanRow'
import styles from './LoanTable.module.css'

interface LoanTableProps {
  loans: Loan[]
}

function LoanTable({ loans }: LoanTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Book</th>
          <th>Member</th>
          <th>Borrowed</th>
          <th>Due</th>
          <th>Returned</th>
          <th>Status</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {loans.map((loan) => (
          <LoanRow key={loan.id} loan={loan} />
        ))}
      </tbody>
    </table>
  )
}

export default LoanTable
