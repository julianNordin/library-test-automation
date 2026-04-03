export const queryKeys = {
  books: {
    all: ['books'] as const,
    detail: (id: number) => ['books', id] as const,
  },
  members: {
    all: ['members'] as const,
    detail: (id: number) => ['members', id] as const,
  },
  loans: {
    all: ['loans'] as const,
    overdue: ['loans', 'overdue'] as const,
    byMember: (memberId: number) => ['loans', 'member', memberId] as const,
  },
}
