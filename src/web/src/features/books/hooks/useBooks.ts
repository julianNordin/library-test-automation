import { useQuery } from '@tanstack/react-query'
import { booksApi } from '../../../api/booksApi'
import { queryKeys } from '../../../lib/queryKeys'

export function useBooks() {
  return useQuery({
    queryKey: queryKeys.books.all,
    queryFn: booksApi.getAll,
  })
}
