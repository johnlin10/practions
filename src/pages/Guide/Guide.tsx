import React from 'react'
import { Link } from 'react-router-dom'
import './Guide.scss'
import { INSTALL_PATH } from '../Install/meta'
import { TRANSFER_PATH } from '../Transfer/meta'
import { LEARNING_PATH } from '../Learning/meta'
import { GUIDE_TITLE, GUIDE_DESCRIPTION } from './meta'
import { usePageMeta } from '@/hooks/usePageMeta'

// 設定頁「使用指南」分類也照這個順序排列
const GUIDES = [
  {
    path: INSTALL_PATH,
    icon: 'add_to_home_screen',
    title: '加入主畫面',
    text: '像 App 一樣全螢幕使用，沒有網路也能練習。',
  },
  {
    path: TRANSFER_PATH,
    icon: 'swap_horiz',
    title: '如何轉移資料',
    text: '把舊網址或舊手機的測驗紀錄搬過來。',
  },
  {
    path: LEARNING_PATH,
    icon: 'school',
    title: 'Practions 如何幫你記住',
    text: '測驗、錯題複習與掌握度怎麼幫你記得更久。',
  },
]

/**
 * [page] Guide component
 * 使用指南：把各篇教學排成一本本說明書
 */
function Guide(): React.ReactElement {
  usePageMeta(GUIDE_TITLE, GUIDE_DESCRIPTION)

  return (
    <div className="page">
      <div className="page-container">
        <h1>使用指南</h1>
        <div className="guide-shelf">
          {GUIDES.map(({ path, icon, title, text }) => (
            <Link key={path} className="guide-book no-style" to={path}>
              <span
                className="material-symbols-rounded fill guide-book-icon"
                aria-hidden="true"
              >
                {icon}
              </span>
              <strong className="guide-book-title">{title}</strong>
              <span className="guide-book-text">{text}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Guide
