import { useEffect, useMemo, useState } from 'react'
import type { Book } from '../../../types/domain'

export type Availability = 'all' | 'available' | 'unavailable'
export type SortBy = 'title' | 'author' | 'year'

export function useBookFilters(books: Book[] | undefined, activeLoanBookIds: Set<number>) {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [availability, setAvailability] = useState<Availability>('all')
  const [sortBy, setSortBy] = useState<SortBy>('title')

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250)
    return () => clearTimeout(timeout)
  }, [search])

  const filteredBooks = useMemo(() => {
    if (!books) return []

    const query = debouncedSearch.trim().toLowerCase()
    let result = query
      ? books.filter(
          (book) =>
            book.title.toLowerCase().includes(query) || book.author.toLowerCase().includes(query),
        )
      : books

    if (availability !== 'all') {
      result = result.filter((book) =>
        availability === 'available'
          ? !activeLoanBookIds.has(book.id)
          : activeLoanBookIds.has(book.id),
      )
    }

    return [...result].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'author') return a.author.localeCompare(b.author)
      return a.publicationYear - b.publicationYear
    })
  }, [books, debouncedSearch, availability, sortBy, activeLoanBookIds])

  return { search, setSearch, availability, setAvailability, sortBy, setSortBy, filteredBooks }
}
