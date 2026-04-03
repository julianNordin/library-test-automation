import { useQuery } from '@tanstack/react-query'
import { loansApi } from '../../../api/loansApi'
import { queryKeys } from '../../../lib/queryKeys'

export function useOverdueLoans(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.loans.overdue,
    queryFn: loansApi.getOverdue,
    enabled,
  })
}
