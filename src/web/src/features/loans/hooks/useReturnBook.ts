import { useQueryClient } from '@tanstack/react-query'
import { loansApi } from '../../../api/loansApi'
import { useMutationWithToast } from '../../../hooks/useMutationWithToast'
import { queryKeys } from '../../../lib/queryKeys'

export function useReturnBook() {
  const queryClient = useQueryClient()

  return useMutationWithToast({
    mutationFn: (loanId: number) => loansApi.returnLoan(loanId),
    successMessage: 'Book returned successfully.',
    errorMessage: (error) => error.detail ?? error.title ?? 'Could not return this book.',
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.books.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.loans.all })
    },
  })
}
