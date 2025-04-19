import './Navigate.scss'
import { useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
function Navigate() {
  const pathname = useLocation().pathname
  const [hideNavigate, setHideNavigate] = useState(false)

  useEffect(() => {
    const hideNavigatePaths = ['/quiz/', '/results', '/history/', '/bank/']
    if (hideNavigatePaths.some((path) => pathname.startsWith(path))) {
      setHideNavigate(true)
    } else {
      setHideNavigate(false)
    }
  }, [pathname])

  return (
    <div className={`navigate ${hideNavigate ? 'hide' : ''}`}>
      <div className="navigate-button">
        <Link className="no-style" data-active={pathname === '/'} to="/">
          <span className="material-symbols-rounded fill">home</span>
        </Link>
        <Link
          className="no-style"
          data-active={
            pathname.includes('/quiz') || pathname.includes('/history')
          }
          to="/quiz"
        >
          <span className="material-symbols-rounded fill">
            assignment_turned_in
          </span>
        </Link>
        <Link
          className="no-style"
          data-active={pathname.includes('/bank')}
          to="/bank"
        >
          <span class="material-symbols-rounded fill">library_books</span>
        </Link>
        <Link
          className="no-style"
          data-active={pathname.includes('/settings')}
          to="/settings"
        >
          <span className="material-symbols-rounded fill">settings</span>
        </Link>
      </div>
    </div>
  )
}

export default Navigate
