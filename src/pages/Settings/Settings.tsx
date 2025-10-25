import React from 'react'
import './Settings.scss'
import packageJson from '../../../package.json'
import { STORAGE_KEYS, HistoryRecord } from '../../types'

/**
 * Settings component
 * 設定頁面，包含測驗記錄管理和開發資訊
 */
function Settings(): React.ReactElement {
  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY) || '[]'
  ) as HistoryRecord[]
  const hasHistory = history.length > 0

  const clearHistory = (): void => {
    if (window.confirm(`確定要清除 ${history.length} 筆測驗紀錄嗎？`)) {
      localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify([]))
      window.location.reload()
    }
  }

  const handleClearHistoryClick = (): void => {
    if (!hasHistory) return
    clearHistory()
  }

  const openLink = (url: string): void => {
    window.open(url, '_blank')
  }

  const openEmail = (email: string): void => {
    window.open(`mailto:${email}`, '_blank')
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>設定</h1>

        <div className="settings-list">
          <div className="settings-list-group has-title">
            <h5>測驗</h5>
            <div
              className={`settings-list-group-item action ${
                !hasHistory ? 'disabled' : ''
              }`}
              onClick={handleClearHistoryClick}
            >
              <p>
                <span className="material-symbols-outlined icon">delete</span>
                清除測驗紀錄
              </p>
              {!hasHistory ? (
                <p className="info">沒有測驗紀錄</p>
              ) : (
                <p className="info">{history.length} 筆紀錄</p>
              )}
            </div>
          </div>

          <div className="settings-list-group has-title">
            <h5>開發資訊</h5>
            <div className="settings-list-group-item">
              <p>版本</p>
              <p className="info">{packageJson.version}</p>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => openLink('https://github.com/johnlin10/practions')}
            >
              <p>開放原始碼</p>
              <span className="material-symbols-rounded icon">
                arrow_outward
              </span>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => openLink('https://github.com/johnlin10')}
            >
              <p>開發者</p>
              <p className="info">John Lin</p>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => openEmail('johnlin@johnlin.me')}
            >
              <p>聯絡方式</p>
              <p className="info">johnlin@johnlin.me</p>
            </div>
          </div>
        </div>

        <div className="copyright">
          <p>© 2025 Practions. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
