import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Member } from '../../../types/domain'
import styles from './MemberCard.module.css'

interface MemberCardProps {
  member: Member
}

function MemberCard({ member }: MemberCardProps) {
  return (
    <article className={styles.card}>
      <h2>
        <Link to={`/members/${member.id}`}>{member.fullName}</Link>
      </h2>
      <p className={styles.meta}>{member.email}</p>
    </article>
  )
}

export default memo(MemberCard)
