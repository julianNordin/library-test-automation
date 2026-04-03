import { useQuery } from '@tanstack/react-query'
import { membersApi } from '../../../api/membersApi'
import { queryKeys } from '../../../lib/queryKeys'

export function useMembers() {
  return useQuery({
    queryKey: queryKeys.members.all,
    queryFn: membersApi.getAll,
  })
}
