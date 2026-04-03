import { useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { useToast } from '../context/useToast'
import type { ApiError } from '../api/apiClient'

interface MutationWithToastOptions<TData, TVariables> extends UseMutationOptions<
  TData,
  ApiError,
  TVariables
> {
  successMessage: string | ((data: TData) => string)
  errorMessage?: (error: ApiError) => string
}

export function useMutationWithToast<TData, TVariables>({
  successMessage,
  errorMessage,
  onSuccess,
  onError,
  ...options
}: MutationWithToastOptions<TData, TVariables>) {
  const { showToast } = useToast()

  return useMutation<TData, ApiError, TVariables>({
    ...options,
    onSuccess: (data, variables, onMutateResult, context) => {
      const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
      showToast(message, 'success')
      onSuccess?.(data, variables, onMutateResult, context)
    },
    onError: (error, variables, onMutateResult, context) => {
      const message = errorMessage
        ? errorMessage(error)
        : (error.detail ?? error.title ?? 'Something went wrong.')
      showToast(message, 'error')
      onError?.(error, variables, onMutateResult, context)
    },
  })
}
