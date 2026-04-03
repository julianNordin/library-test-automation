import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../../../api/membersApi'
import type { ApiError } from '../../../api/apiClient'
import type { Member } from '../../../types/domain'
import { queryKeys } from '../../../lib/queryKeys'

export function useMember(id: number) {
  return useQuery<Member, ApiError>({
    queryKey: queryKeys.members.detail(id),
    queryFn: () => membersApi.getById(id),
  })
}
