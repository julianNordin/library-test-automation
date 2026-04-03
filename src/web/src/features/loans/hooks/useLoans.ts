import { useQuery } from '@tanstack/react-query'
import { loansApi } from '../../../api/loansApi'
import { queryKeys } from '../../../lib/queryKeys'

export function useLoans() {
  return useQuery({
    queryKey: queryKeys.loans.all,
    queryFn: loansApi.getAll,
  })
}
