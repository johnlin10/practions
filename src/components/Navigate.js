import '../styles/Navigate.scss'
import { useNavigate, useLocation, Link } from 'react-router-dom'

function Navigate() {
  const navigate = useNavigate()
  const pathname = useLocation().pathname

  if (
    pathname.startsWith('/quiz/') ||
    pathname.startsWith('/results') ||
    pathname.startsWith('/history/') ||
    pathname.startsWith('/bank/')
  ) {
    return null
  }

  return (
    <div className="navigate">
      <div className="navigate-button">
        <Link className="no-style" data-active={pathname === '/'} to="/">
          首頁
        </Link>
        <Link
          className="no-style"
          data-active={pathname.includes('/quiz')}
          to="/quiz"
        >
          測驗
        </Link>
        <Link
          className="no-style"
          data-active={pathname.includes('/bank')}
          to="/bank"
        >
          題庫
        </Link>
        <Link
          className="no-style"
          data-active={pathname.includes('/history')}
          to="/history"
        >
          紀錄
        </Link>
      </div>
    </div>
  )
}

export default Navigate
