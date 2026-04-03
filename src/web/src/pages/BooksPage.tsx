import { useMemo } from 'react'
import { useBooks } from '../features/books/hooks/useBooks'
import { useLoans } from '../features/loans/hooks/useLoans'
import { useBookFilters } from '../features/books/hooks/useBookFilters'
import BookCard from '../features/books/components/BookCard'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import Skeleton from '../components/Skeleton'
import styles from './BooksPage.module.css'

function BooksPage() {
  const { data: books, isLoading, isError } = useBooks()
  const { data: loans } = useLoans()

  const activeLoanBookIds = useMemo(
    () =>
      new Set(
        (loans ?? []).filter((loan) => loan.returnedDate === null).map((loan) => loan.bookId),
      ),
    [loans],
  )

  const { search, setSearch, availability, setAvailability, sortBy, setSortBy, filteredBooks } =
    useBookFilters(books, activeLoanBookIds)

  return (
    <div>
      <h1>Books</h1>

      <fieldset className={styles.filters}>
        <legend className="visually-hidden">Filter and sort books</legend>

        <div className={styles.filterField}>
          <label htmlFor="book-search">Search</label>
          <input
            id="book-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by title or author"
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="book-availability">Availability</label>
          <select
            id="book-availability"
            value={availability}
            onChange={(event) => setAvailability(event.target.value as typeof availability)}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="unavailable">On loan</option>
          </select>
        </div>

        <div className={styles.filterField}>
          <label htmlFor="book-sort">Sort by</label>
          <select
            id="book-sort"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="year">Publication year</option>
          </select>
        </div>
      </fieldset>

      {isLoading && <Skeleton rows={5} />}
      {isError && <ErrorMessage message="Something went wrong loading books." />}
      {books && filteredBooks.length === 0 && <EmptyState message="No books match your filters." />}
      {books && filteredBooks.length > 0 && (
        <div className={styles.grid}>
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  )
}

export default BooksPage
