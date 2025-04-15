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
