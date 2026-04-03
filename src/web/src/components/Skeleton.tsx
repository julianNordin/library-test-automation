import styles from './Skeleton.module.css'

interface SkeletonProps {
  rows?: number
}

function Skeleton({ rows = 3 }: SkeletonProps) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={styles.bar} />
      ))}
    </div>
  )
}

export default Skeleton
