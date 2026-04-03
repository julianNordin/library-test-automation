import { useQueryClient } from '@tanstack/react-query'
import { loansApi } from '../../../api/loansApi'
import type { BorrowRequest } from '../../../types/domain'
import { useMutationWithToast } from '../../../hooks/useMutationWithToast'
import { queryKeys } from '../../../lib/queryKeys'

export function useBorrowBook() {
  const queryClient = useQueryClient()

  return useMutationWithToast({
    mutationFn: (request: BorrowRequest) => loansApi.borrow(request),
    successMessage: 'Book borrowed successfully.',
    errorMessage: (error) => error.detail ?? error.title ?? 'Could not borrow this book.',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.members.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.loans.all })
    },
  })
}
