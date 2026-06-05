import React, { useState } from 'react'
import './Settings.scss'
import packageJson from '../../../package.json'
import { STORAGE_KEYS, HistoryRecord, DEFAULT_SETTINGS } from '../../types'
import { usePVQCSettings } from '../../hooks/useSettings'

/**
 * Settings component
 * 設定頁面，包含測驗記錄管理和開發資訊
 */
function Settings(): React.ReactElement {
  const history = JSON.parse(
    localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY) || '[]'
  ) as HistoryRecord[]
  const hasHistory = history.length > 0

  // PVQC 設定管理
  const { pvqcSettings, updatePVQCSettings } = usePVQCSettings()
  const [tempQuestionCount, setTempQuestionCount] = useState(
    pvqcSettings.defaultQuestionCount
  )
  const [tempTimePerStage, setTempTimePerStage] = useState(
    pvqcSettings.defaultTimePerStage
  )

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

  // PVQC 設定相關函數
  // const handleSavePVQCSettings = (): void => {
  //   updatePVQCSettings({
  //     defaultQuestionCount: tempQuestionCount,
  //     defaultTimePerStage: tempTimePerStage,
  //   })
  // }

  const handleResetPVQCSettings = (): void => {
    // 重置 PVQC 設定為預設值
    updatePVQCSettings({
      defaultQuestionCount: DEFAULT_SETTINGS.pvqc.defaultQuestionCount,
      defaultTimePerStage: DEFAULT_SETTINGS.pvqc.defaultTimePerStage,
    })
    // 同時更新臨時狀態
    setTempQuestionCount(DEFAULT_SETTINGS.pvqc.defaultQuestionCount)
    setTempTimePerStage(DEFAULT_SETTINGS.pvqc.defaultTimePerStage)
  }

  // 是否有未保存的設定
  // const hasUnsavedChanges =
  //   tempQuestionCount !== pvqcSettings.defaultQuestionCount ||
  //   tempTimePerStage !== pvqcSettings.defaultTimePerStage

  return (
    <div className="page">
      <div className="page-container">
        <h1>設定</h1>

        <div className="settings-list">
          <div className="settings-list-group has-title">
            <h5>PVQC 測驗設定</h5>
            <div className="settings-list-group-item">
              <p>預設題目數</p>
              <div className="pvqc-settings-input-container">
                <input
                  type="number"
                  value={tempQuestionCount}
                  onChange={(e) => {
                    setTempQuestionCount(Number(e.target.value))
                    updatePVQCSettings({
                      defaultQuestionCount: Number(e.target.value),
                    })
                  }}
                  min={5}
                  max={50}
                />
                <span className="unit">題</span>
              </div>
            </div>
            <div className="settings-list-group-item">
              <p>預設時間</p>
              <div className="pvqc-settings-input-container">
                <input
                  type="number"
                  value={tempTimePerStage}
                  onChange={(e) => {
                    setTempTimePerStage(Number(e.target.value))
                    updatePVQCSettings({
                      defaultTimePerStage: Number(e.target.value),
                    })
                  }}
                  min={1}
                  max={30}
                />
                <span className="unit">分鐘</span>
              </div>
            </div>
            <div className="settings-list-group-item">
              <p>重置設定</p>
              <button
                className="settings-action-button primary"
                onClick={handleResetPVQCSettings}
              >
                恢復預設
              </button>
            </div>
          </div>

          <div className="settings-list-group has-title">
            <h5>測驗紀錄</h5>
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
