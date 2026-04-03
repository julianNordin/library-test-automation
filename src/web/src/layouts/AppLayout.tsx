import { Outlet } from 'react-router-dom'
import NavBar from '../components/NavBar'

function AppLayout() {
  return (
    <>
      <header>
        <NavBar />
      </header>
      <main>
        <Outlet />
      </main>
    </>
  )
}

export default AppLayout
