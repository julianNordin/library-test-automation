import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { borrowSchema, type BorrowFormInput, type BorrowFormValues } from '../schemas/borrowSchema'
import { useBorrowBook } from '../hooks/useBorrowBook'
import { useBooks } from '../../books/hooks/useBooks'
import { useMembers } from '../../members/hooks/useMembers'
import styles from './BorrowForm.module.css'

function BorrowForm() {
  const { data: books } = useBooks()
  const { data: members } = useMembers()
  const borrowBook = useBorrowBook()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BorrowFormInput, unknown, BorrowFormValues>({
    resolver: zodResolver(borrowSchema),
  })

  const onSubmit = (values: BorrowFormValues) => {
    borrowBook.mutate(values, { onSuccess: () => reset() })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <h2>Borrow a book</h2>

      <div className={styles.field}>
        <label htmlFor="borrow-book">Book</label>
        <select id="borrow-book" defaultValue="" {...register('bookId')}>
          <option value="" disabled>
            Select a book
          </option>
          {books?.map((book) => (
            <option key={book.id} value={book.id}>
              {book.title}
            </option>
          ))}
        </select>
        {errors.bookId && (
          <p className={styles.error} role="alert">
            {errors.bookId.message}
          </p>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="borrow-member">Member</label>
        <select id="borrow-member" defaultValue="" {...register('memberId')}>
          <option value="" disabled>
            Select a member
          </option>
          {members?.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>
        {errors.memberId && (
          <p className={styles.error} role="alert">
            {errors.memberId.message}
          </p>
        )}
      </div>

      <button type="submit" disabled={borrowBook.isPending}>
        {borrowBook.isPending ? 'Borrowing…' : 'Borrow'}
      </button>
    </form>
  )
}

export default BorrowForm
