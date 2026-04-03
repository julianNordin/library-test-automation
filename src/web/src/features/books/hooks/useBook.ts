import { useQuery } from '@tanstack/react-query'
import { booksApi } from '../../../api/booksApi'
import type { ApiError } from '../../../api/apiClient'
import type { Book } from '../../../types/domain'
import { queryKeys } from '../../../lib/queryKeys'

export function useBook(id: number) {
  return useQuery<Book, ApiError>({
    queryKey: queryKeys.books.detail(id),
    queryFn: () => booksApi.getById(id),
  })
}
