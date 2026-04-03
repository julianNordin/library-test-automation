import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <div>
      <h1>Page not found</h1>
      <p>
        <Link to="/">Go back home</Link>
      </p>
    </div>
  )
}

export default NotFoundPage
