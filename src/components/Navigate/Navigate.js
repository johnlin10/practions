import './Navigate.scss'
import { useLocation, Link } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
function Navigate() {
  const pathname = useLocation().pathname

  const linkList = useMemo(
    () => [
      {
        path: '/',
        label: 'Home',
        icon: 'home',
        active: pathname === '/',
      },
      {
        path: '/quiz',
        label: 'Quiz',
        icon: 'assignment_turned_in',
        active: pathname.includes('/quiz') || pathname.includes('/history'),
      },
      {
        path: '/bank',
        label: 'Bank',
        icon: 'library_books',
        active: pathname.includes('/bank'),
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: 'settings',
        active: pathname.includes('/settings'),
      },
    ],
    [pathname]
  )

  const initialActiveIndex = linkList.findIndex((link) => link.active)
  const [hideNavigate, setHideNavigate] = useState(false)
  const [activeIndex, setActiveIndex] = useState(
    initialActiveIndex !== -1 ? initialActiveIndex : 0
  )

  useEffect(() => {
    const hideNavigatePaths = ['/quiz/', '/results', '/history/', '/bank/']
    if (hideNavigatePaths.some((path) => pathname.startsWith(path))) {
      setHideNavigate(true)
    } else {
      setHideNavigate(false)
    }
  }, [pathname])

  useEffect(() => {
    const newActiveIndex = linkList.findIndex((link) => link.active)
    if (newActiveIndex !== -1) {
      setActiveIndex(newActiveIndex)
    }
  }, [pathname, linkList])

  return (
    <div className={`navigate ${hideNavigate ? 'hide' : ''}`}>
      <div className="navigate-button">
        <div
          className="active-square"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        ></div>
        {linkList.map((link, index) => (
          <Link
            className="no-style"
            data-active={link.active}
            to={link.path}
            onClick={() => setActiveIndex(index)}
          >
            <span className="material-symbols-rounded fill">{link.icon}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Navigate
