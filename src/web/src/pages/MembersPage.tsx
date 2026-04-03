import { useMembers } from '../features/members/hooks/useMembers'
import MemberCard from '../features/members/components/MemberCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import styles from './MembersPage.module.css'

function MembersPage() {
  const { data: members, isLoading, isError } = useMembers()

  return (
    <div>
      <h1>Members</h1>
      {isLoading && <LoadingSpinner label="Loading members…" />}
      {isError && <ErrorMessage message="Something went wrong loading members." />}
      {members && members.length === 0 && <EmptyState message="No members yet." />}
      {members && members.length > 0 && (
        <div className={styles.grid}>
          {members.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MembersPage
