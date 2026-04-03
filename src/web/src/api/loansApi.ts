import { apiClient } from './apiClient'
import type { BorrowRequest, Loan } from '../types/domain'

export const loansApi = {
  getAll: () => apiClient.get<Loan[]>('/api/loans'),
  getById: (id: number) => apiClient.get<Loan>(`/api/loans/${id}`),
  getOverdue: () => apiClient.get<Loan[]>('/api/loans/overdue'),
  getByMember: (memberId: number) => apiClient.get<Loan[]>(`/api/loans/member/${memberId}`),
  borrow: (request: BorrowRequest) => apiClient.post<Loan>('/api/loans/borrow', request),
  returnLoan: (id: number) => apiClient.post<Loan>(`/api/loans/${id}/return`),
}
