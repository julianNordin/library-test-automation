import { useParams } from 'react-router-dom'
import { useBook } from '../features/books/hooks/useBook'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

function BookDetailPage() {
  const { id } = useParams<{ id: string }>()
  const bookId = Number(id)
  const { data: book, isLoading, error } = useBook(bookId)

  if (isLoading) {
    return <LoadingSpinner label="Loading book…" />
  }

  if (error?.status === 404) {
    return <ErrorMessage message="This book could not be found." />
  }

  if (error) {
    return <ErrorMessage message="Something went wrong loading this book." />
  }

  if (!book) {
    return null
  }

  return (
    <div>
      <h1>{book.title}</h1>
      <p>{book.author}</p>
      <p>ISBN {book.isbn}</p>
      <p>Published {book.publicationYear}</p>
    </div>
  )
}

export default BookDetailPage
