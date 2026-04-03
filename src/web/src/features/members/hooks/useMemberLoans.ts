import { useQuery } from '@tanstack/react-query'
import { loansApi } from '../../../api/loansApi'
import { queryKeys } from '../../../lib/queryKeys'

export function useMemberLoans(memberId: number) {
  return useQuery({
    queryKey: queryKeys.loans.byMember(memberId),
    queryFn: () => loansApi.getByMember(memberId),
  })
}
