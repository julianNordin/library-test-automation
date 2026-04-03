import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBookFilters } from './useBookFilters'
import type { Book } from '../../../types/domain'

const books: Book[] = [
  { id: 1, title: 'Clean Code', author: 'Robert C. Martin', isbn: '1', publicationYear: 2008 },
  { id: 2, title: 'Refactoring', author: 'Martin Fowler', isbn: '2', publicationYear: 1999 },
  { id: 3, title: 'Domain-Driven Design', author: 'Eric Evans', isbn: '3', publicationYear: 2003 },
]

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useBookFilters', () => {
  it('sorts by title by default', () => {
    const { result } = renderHook(() => useBookFilters(books, new Set()))
    expect(result.current.filteredBooks.map((b) => b.title)).toEqual([
      'Clean Code',
      'Domain-Driven Design',
      'Refactoring',
    ])
  })

  it('filters by a debounced search term matching title or author', () => {
    const { result } = renderHook(() => useBookFilters(books, new Set()))

    act(() => result.current.setSearch('fowler'))
    // not yet applied before the debounce timer fires
    expect(result.current.filteredBooks).toHaveLength(3)

    act(() => vi.advanceTimersByTime(250))
    expect(result.current.filteredBooks.map((b) => b.title)).toEqual(['Refactoring'])
  })

  it('filters by availability using the active loan book ids', () => {
    const activeLoanBookIds = new Set([2])
    const { result } = renderHook(() => useBookFilters(books, activeLoanBookIds))

    act(() => result.current.setAvailability('unavailable'))
    expect(result.current.filteredBooks.map((b) => b.id)).toEqual([2])

    act(() => result.current.setAvailability('available'))
    expect(result.current.filteredBooks.map((b) => b.id)).toEqual([1, 3])
  })

  it('sorts by publication year', () => {
    const { result } = renderHook(() => useBookFilters(books, new Set()))

    act(() => result.current.setSortBy('year'))
    expect(result.current.filteredBooks.map((b) => b.publicationYear)).toEqual([1999, 2003, 2008])
  })
})
