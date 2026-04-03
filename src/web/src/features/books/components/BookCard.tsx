import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '../../../types/domain'
import styles from './BookCard.module.css'

interface BookCardProps {
  book: Book
}

function BookCard({ book }: BookCardProps) {
  return (
    <article className={styles.card}>
      <h2>
        <Link to={`/books/${book.id}`}>{book.title}</Link>
      </h2>
      <p className={styles.meta}>{book.author}</p>
      <p className={styles.meta}>{book.publicationYear}</p>
    </article>
  )
}

export default memo(BookCard)
