import { memo } from 'react'
import type { Loan } from '../../../types/domain'
import OverdueBadge from './OverdueBadge'
import ReturnButton from './ReturnButton'
import styles from './LoanTable.module.css'

interface LoanRowProps {
  loan: Loan
}

function LoanRow({ loan }: LoanRowProps) {
  return (
    <tr className={styles.row}>
      <td className={styles.cell} data-label="Book">
        {loan.bookTitle}
      </td>
      <td className={styles.cell} data-label="Member">
        {loan.memberFullName}
      </td>
      <td className={styles.cell} data-label="Borrowed">
        {new Date(loan.borrowedDate).toLocaleDateString()}
      </td>
      <td className={styles.cell} data-label="Due">
        {new Date(loan.dueDate).toLocaleDateString()}
      </td>
      <td className={styles.cell} data-label="Returned">
        {loan.returnedDate ? new Date(loan.returnedDate).toLocaleDateString() : '—'}
      </td>
      <td className={styles.cell} data-label="Status">
        {loan.isOverdue && <OverdueBadge />}
      </td>
      <td className={styles.cell} data-label="Action">
        {loan.returnedDate === null && <ReturnButton loanId={loan.id} />}
      </td>
    </tr>
  )
}

export default memo(LoanRow)
