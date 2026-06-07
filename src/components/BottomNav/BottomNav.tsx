import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import './BottomNav.scss'

interface NavigationLink {
  path: string
  label: string
  icon: string
  active: boolean
}

/**
 * [component] BottomNav component
 * 底部導航欄元件，根據當前路徑顯示對應的導航狀態
 * @returns {React.ReactElement} - 底部導航欄元件
 */
function BottomNav(): React.ReactElement {
  // 當前路徑
  const pathname = useLocation().pathname
  // 是否顯示導航欄
  const [showNavigate, setShowNavigate] = useState<boolean>(false)

  // 導航連結列表
  const linkList = useMemo<NavigationLink[]>(
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
        active:
          pathname.includes('/quiz') ||
          pathname.includes('/history') ||
          pathname.startsWith('/pvqc'),
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

  // 隱藏導航欄
  useEffect(() => {
    // 隱藏導航欄的路徑列表
    const hideNavigatePaths = ['/quiz/', '/results', '/history/', '/bank/']
    // 如果當前路徑在隱藏路徑列表中，則隱藏導航欄
    if (hideNavigatePaths.some((path) => pathname.startsWith(path))) {
      setShowNavigate(false)
    } else {
      // 否則顯示導航欄
      setShowNavigate(true)
    }
  }, [pathname])

  // 渲染導航欄
  return (
    <div className={`navigate${showNavigate ? ' show' : ''}`}>
      <div className="navigate-links">
        {/* 渲染導航連結 */}
        {linkList.map((link) => (
          <Link
            key={link.path}
            className="no-style"
            data-active={link.active}
            to={link.path}
          >
            <span className="material-symbols-rounded fill">{link.icon}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default BottomNav
