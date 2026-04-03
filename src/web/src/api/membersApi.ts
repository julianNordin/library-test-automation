import { apiClient } from './apiClient'
import type { Member } from '../types/domain'

export const membersApi = {
  getAll: () => apiClient.get<Member[]>('/api/members'),
  getById: (id: number) => apiClient.get<Member>(`/api/members/${id}`),
}
