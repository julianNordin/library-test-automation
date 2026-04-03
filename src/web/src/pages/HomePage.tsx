import { Link } from 'react-router-dom'

function HomePage() {
  return (
    <div>
      <h1>Library</h1>
      <p>Browse books, borrow and return them, and check loan history.</p>
      <nav>
        <Link to="/books">Browse books</Link>
      </nav>
    </div>
  )
}

export default HomePage
