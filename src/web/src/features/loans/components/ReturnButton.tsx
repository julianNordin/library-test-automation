import { useState } from 'react'
import { useReturnBook } from '../hooks/useReturnBook'

interface ReturnButtonProps {
  loanId: number
}

function ReturnButton({ loanId }: ReturnButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const returnBook = useReturnBook()

  const handleReturn = () => {
    returnBook.mutate(loanId, { onSettled: () => setConfirming(false) })
  }

  if (confirming) {
    return (
      <span>
        <span>Return this book?</span>{' '}
        <button type="button" disabled={returnBook.isPending} onClick={handleReturn}>
          {returnBook.isPending ? 'Returning…' : 'Confirm'}
        </button>{' '}
        <button type="button" disabled={returnBook.isPending} onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button type="button" onClick={() => setConfirming(true)}>
      Return
    </button>
  )
}

export default ReturnButton
