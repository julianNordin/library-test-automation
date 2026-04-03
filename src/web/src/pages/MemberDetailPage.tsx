import { useParams } from 'react-router-dom'
import { useMember } from '../features/members/hooks/useMember'
import { useMemberLoans } from '../features/members/hooks/useMemberLoans'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'

function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const memberId = Number(id)
  const { data: member, isLoading, error } = useMember(memberId)
  const { data: loans } = useMemberLoans(memberId)

  if (isLoading) {
    return <LoadingSpinner label="Loading member…" />
  }

  if (error?.status === 404) {
    return <ErrorMessage message="This member could not be found." />
  }

  if (error) {
    return <ErrorMessage message="Something went wrong loading this member." />
  }

  if (!member) {
    return null
  }

  return (
    <div>
      <h1>{member.fullName}</h1>
      <p>{member.email}</p>
      <p>Joined {new Date(member.joinedDate).toLocaleDateString()}</p>

      <h2>Loans</h2>
      {loans && loans.length === 0 && <EmptyState message="This member has no loans yet." />}
      {loans && loans.length > 0 && (
        <ul>
          {loans.map((loan) => (
            <li key={loan.id}>
              {loan.bookTitle} — borrowed {new Date(loan.borrowedDate).toLocaleDateString()}
              {loan.returnedDate
                ? ` — returned ${new Date(loan.returnedDate).toLocaleDateString()}`
                : loan.isOverdue
                  ? ' — overdue'
                  : ' — active'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MemberDetailPage
