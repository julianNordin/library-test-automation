import { z } from 'zod'

export const borrowSchema = z.object({
  bookId: z.coerce.number().int().positive('Please select a book'),
  memberId: z.coerce.number().int().positive('Please select a member'),
})

export type BorrowFormInput = z.input<typeof borrowSchema>
export type BorrowFormValues = z.output<typeof borrowSchema>
