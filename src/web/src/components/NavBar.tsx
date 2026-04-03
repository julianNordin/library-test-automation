import { NavLink } from 'react-router-dom'
import styles from './NavBar.module.css'

function linkClassName({ isActive }: { isActive: boolean }) {
  return isActive ? `${styles.link} ${styles.linkActive}` : styles.link
}

function NavBar() {
  return (
    <nav className={styles.nav} aria-label="Main navigation">
      <NavLink to="/" className={styles.brand} end>
        Library
      </NavLink>
      <NavLink to="/books" className={linkClassName}>
        Books
      </NavLink>
      <NavLink to="/members" className={linkClassName}>
        Members
      </NavLink>
      <NavLink to="/loans" className={linkClassName}>
        Loans
      </NavLink>
    </nav>
  )
}

export default NavBar
