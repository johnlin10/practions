import React, { useEffect } from 'react'
import { Outlet, ScrollRestoration, type Location } from 'react-router-dom'
import './App.scss'

// components
import BottomNav from './components/BottomNav/BottomNav'

// data
import { runMigrations } from '@/data/migrations'

/**
 * 捲動位置還原的鍵：列表頁依路徑記住位置（從詳情頁返回時停在原處），
 * 詳情頁每次開啟都是新的鍵，從頂端開始
 */
const scrollKey = (location: Location): string =>
  /^\/(bank|history)\/./.test(location.pathname)
    ? location.key
    : location.pathname

/**
 * App component
 * 所有頁面共用的外層：導覽列、捲動位置還原與全域設置
 */
function App(): React.ReactElement {
  useEffect(() => {
    // 執行跨版本資料遷移（集中於 data/migrations）
    runMigrations()
  }, [])

  // 換頁前記下捲動位置，詳情頁滑出時只顯示當時畫面內的部分（App.scss 的 sheet 轉場）
  // 點擊（連結、關閉按鈕）與瀏覽器返回都在轉場擷取畫面之前觸發
  useEffect(() => {
    const save = (): void =>
      document.documentElement.style.setProperty('--scroll-y', `${scrollY}px`)
    addEventListener('click', save, true)
    addEventListener('popstate', save)
    return () => {
      removeEventListener('click', save, true)
      removeEventListener('popstate', save)
    }
  }, [])

  return (
    <>
      <ScrollRestoration getKey={scrollKey} />
      <BottomNav />
      <Outlet />
    </>
  )
}

export default App
