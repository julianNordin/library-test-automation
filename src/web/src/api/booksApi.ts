import { apiClient } from './apiClient'
import type { Book } from '../types/domain'

export const booksApi = {
  getAll: () => apiClient.get<Book[]>('/api/books'),
  getById: (id: number) => apiClient.get<Book>(`/api/books/${id}`),
}
