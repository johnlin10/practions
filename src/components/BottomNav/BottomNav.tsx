import React, { useState, useEffect, useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useSlideNavigate } from '@/hooks/useSlideNavigate'
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
        label: '首頁',
        icon: 'home',
        active: pathname === '/',
      },
      {
        path: '/quiz',
        label: '測驗',
        icon: 'assignment_turned_in',
        active:
          pathname.includes('/quiz') ||
          pathname.startsWith('/history') ||
          pathname.startsWith('/pvqc'),
      },
      {
        path: '/practice',
        label: '練習',
        icon: 'exercise',
        active: pathname.startsWith('/practice'),
      },
      {
        path: '/bank',
        label: '題庫',
        icon: 'library_books',
        active: pathname.includes('/bank'),
      },
      {
        path: '/settings',
        label: '設定',
        icon: 'settings',
        active: pathname.includes('/settings'),
      },
    ],
    [pathname],
  )

  // 目前在第幾個分頁，切換時依前後順序決定往左或往右
  const activeIndex = linkList.findIndex((link) => link.active)

  const slideTo = useSlideNavigate()

  /**
   * [function] switchTab
   * 切換分頁：往後面的分頁從右邊淡入，往前面的從左邊淡入
   * @param {React.MouseEvent} event - 點擊事件
   * @param {number} index - 要前往的分頁
   * @returns {void}
   */
  const switchTab = (event: React.MouseEvent, index: number): void => {
    // 點目前所在的分頁不做轉場
    if (index === activeIndex) return
    event.preventDefault()
    slideTo(linkList[index].path, index > activeIndex ? 'forward' : 'back')
  }

  // 隱藏導航欄
  useEffect(() => {
    // 隱藏導航欄的路徑列表
    // 單篇使用指南（/guide/）：專心閱讀，回上一層用標題上方的「使用指南 /」
    const hideNavigatePaths = [
      '/quiz/',
      '/history/',
      '/practice/history/',
      '/bank/',
      '/guide/',
    ]
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
      {/* 貼齊視窗底部的實色條，讓 iOS Safari 將工具列周圍變為不透明（見 BottomNav.scss） */}
      <div className="navigate-edge" aria-hidden="true" />
      <div className="navigate-links">
        {/* 渲染導航連結 */}
        {linkList.map((link, index) => (
          <Link
            key={link.path}
            className="no-style"
            data-active={link.active}
            to={link.path}
            onClick={(event) => switchTab(event, index)}
          >
            <span className="material-symbols-rounded fill" aria-hidden="true">
              {link.icon}
            </span>
            <span className="navigate-label">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default BottomNav
