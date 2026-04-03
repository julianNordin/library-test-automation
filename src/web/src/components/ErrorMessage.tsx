function ErrorMessage({
  message = 'Something went wrong. Please try again.',
}: {
  message?: string
}) {
  return <p role="alert">{message}</p>
}

export default ErrorMessage
