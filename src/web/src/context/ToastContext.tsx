import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext } from './useToast'
import styles from './ToastContext.module.css'

interface Toast {
  id: number
  message: string
  variant: 'success' | 'error'
}

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: Toast['variant']) => {
    const id = nextId++
    setToasts((current) => [...current, { id, message, variant }])
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.region} aria-live="polite" role="region" aria-label="Notifications">
        {toasts.map((toast) => (
          <p
            key={toast.id}
            className={`${styles.toast} ${toast.variant === 'error' ? styles.error : styles.success}`}
            role={toast.variant === 'error' ? 'alert' : 'status'}
          >
            {toast.message}
          </p>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
