import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Settings.scss'
import packageJson from '../../../package.json'
import { DEFAULT_SETTINGS, PVQC_LIMITS } from '../../types'
import Stepper from '../../components/Stepper/Stepper'
import { usePVQCSettings } from '../../hooks/useSettings'
import { useQuizHistory } from '@/hooks/useQuizHistory'
import { exportHistory, importHistory } from '@/data/historyStore'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import { signIn, signOut, useAuth } from '@/data/authStore'
import {
  getSystemTheme,
  useResolvedTheme,
  type ResolvedTheme,
} from '@/utils/theme'

const THEME_OPTIONS: { value: ResolvedTheme; label: string; icon: string }[] = [
  { value: 'light', label: '淺色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
]

/**
 * Settings component
 * 設定頁面，包含測驗記錄管理和開發資訊
 */
function Settings(): React.ReactElement {
  const navigate = useNavigate()
  // 測驗紀錄（由資料層提供，清除後即時反映，無需 reload）
  const { history, clearHistory: clearAllHistory } = useQuizHistory()
  const hasHistory = history.length > 0

  // PVQC 設定管理
  const { pvqcSettings, updatePVQCSettings } = usePVQCSettings()

  // 主題：自動模式跟隨系統；關閉時沿用當下的深淺色，之後記住使用者的選擇
  const isAutoTheme = useSettingsStore().theme === 'system'
  const resolvedTheme = useResolvedTheme()

  const handleAutoThemeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    updateSettings({ theme: e.target.checked ? 'system' : getSystemTheme() })
  }

  // 帳號：登入後測驗紀錄改存雲端
  const auth = useAuth()
  const signedIn = auth.status === 'signed-in'
  const [authBusy, setAuthBusy] = useState<boolean>(false)

  const handleSignIn = async (): Promise<void> => {
    if (authBusy || auth.status !== 'guest') return
    setAuthBusy(true)
    try {
      await signIn()
    } catch (error) {
      window.alert((error as Error).message)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSignOut = async (): Promise<void> => {
    if (authBusy) return
    if (
      !window.confirm('確定要登出嗎？測驗紀錄會保留在雲端，下次登入即可看到。')
    )
      return
    setAuthBusy(true)
    try {
      await signOut()
    } catch (error) {
      window.alert((error as Error).message)
      setAuthBusy(false)
    }
  }

  const clearHistory = (): void => {
    const message = signedIn
      ? `確定要清除 ${history.length} 筆測驗紀錄嗎？雲端與所有裝置上的紀錄都會一併刪除。`
      : `確定要清除 ${history.length} 筆測驗紀錄嗎？`
    if (window.confirm(message)) {
      clearAllHistory()
    }
  }

  const handleClearHistoryClick = (): void => {
    if (!hasHistory) return
    clearHistory()
  }

  const handleExportClick = (): void => {
    if (!hasHistory) return
    const url = URL.createObjectURL(
      new Blob([exportHistory()], { type: 'application/json' }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = `practions-history-${new Date().toLocaleDateString('sv')}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importInputRef = useRef<HTMLInputElement>(null)
  const handleImportFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> => {
    const file = e.target.files?.[0]
    // 清空讓同一個檔案可以再選一次
    e.target.value = ''
    if (!file) return
    try {
      const count = importHistory(await file.text())
      window.alert(
        count > 0 ? `已匯入 ${count} 筆測驗紀錄` : '沒有新的測驗紀錄可匯入',
      )
    } catch (error) {
      window.alert(`匯入失敗：${(error as Error).message}`)
    }
  }

  const openLink = (url: string): void => {
    window.open(url, '_blank')
  }

  const openEmail = (email: string): void => {
    window.open(`mailto:${email}`, '_blank')
  }

  // PVQC 設定相關函數
  const handleResetPVQCSettings = (): void => {
    // 重置 PVQC 設定為預設值
    updatePVQCSettings({
      defaultQuestionCount: DEFAULT_SETTINGS.pvqc.defaultQuestionCount,
      defaultTimePerStage: DEFAULT_SETTINGS.pvqc.defaultTimePerStage,
    })
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>設定</h1>

        <div className="settings-list">
          <div className="settings-list-group has-title">
            <h5>帳號</h5>
            {signedIn ? (
              <>
                <div className="settings-list-group-item">
                  <p>
                    <span className="material-symbols-outlined icon">
                      account_circle
                    </span>
                    {auth.email}
                  </p>
                  <p className="info">
                    {auth.synced
                      ? `已同步 ${auth.synced} 筆本機紀錄`
                      : '紀錄已同步'}
                  </p>
                </div>
                <div
                  className={`settings-list-group-item action ${
                    authBusy ? 'disabled' : ''
                  }`}
                  onClick={handleSignOut}
                >
                  <p>
                    <span className="material-symbols-outlined icon">
                      logout
                    </span>
                    登出
                  </p>
                </div>
              </>
            ) : (
              <div
                className={`settings-list-group-item action ${
                  auth.status !== 'guest' || authBusy ? 'disabled' : ''
                }`}
                onClick={handleSignIn}
              >
                <p>
                  <span className="material-symbols-outlined icon">login</span>
                  {auth.status === 'checking'
                    ? '正在確認登入狀態'
                    : '使用 Google 登入'}
                </p>
                <p className="info">紀錄自動同步到雲端</p>
              </div>
            )}
            {auth.error && (
              <div className="settings-list-group-item">
                <p className="info">{auth.error}</p>
              </div>
            )}
          </div>

          <div className="settings-list-group has-title">
            <h5>主題設定</h5>
            <label className="settings-list-group-item action">
              <p>自動模式</p>
              <input
                type="checkbox"
                role="switch"
                className="switch"
                checked={isAutoTheme}
                onChange={handleAutoThemeChange}
              />
            </label>
            {THEME_OPTIONS.map(({ value, label, icon }) => (
              <label
                key={value}
                className={`settings-list-group-item action ${
                  isAutoTheme ? 'disabled' : ''
                }`}
              >
                <p>
                  <span className="material-symbols-outlined icon">{icon}</span>
                  {label}
                </p>
                <input
                  type="radio"
                  name="theme"
                  className="visually-hidden"
                  checked={resolvedTheme === value}
                  disabled={isAutoTheme}
                  onChange={() => updateSettings({ theme: value })}
                />
                {resolvedTheme === value && (
                  <span className="material-symbols-rounded icon selected">
                    check
                  </span>
                )}
              </label>
            ))}
          </div>

          <div className="settings-list-group has-title">
            <h5>PVQC 測驗設定</h5>
            <div className="settings-list-group-item">
              <p>預設題目數</p>
              <Stepper
                label="預設題目數"
                value={pvqcSettings.defaultQuestionCount}
                onChange={(v) =>
                  updatePVQCSettings({ defaultQuestionCount: v })
                }
                {...PVQC_LIMITS.questionCount}
                unit="題"
              />
            </div>
            <div className="settings-list-group-item">
              <p>預設時間</p>
              <Stepper
                label="預設時間"
                value={pvqcSettings.defaultTimePerStage}
                onChange={(v) => updatePVQCSettings({ defaultTimePerStage: v })}
                {...PVQC_LIMITS.timePerStage}
                unit="分鐘"
              />
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
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={handleImportFile}
            />
            <div
              className={`settings-list-group-item action ${
                !hasHistory ? 'disabled' : ''
              }`}
              onClick={handleExportClick}
            >
              <p>
                <span className="material-symbols-outlined icon">download</span>
                匯出測驗紀錄
              </p>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => importInputRef.current?.click()}
            >
              <p>
                <span className="material-symbols-outlined icon">upload</span>
                匯入測驗紀錄
              </p>
            </div>
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
            <h5>應用程式</h5>
            <div
              className="settings-list-group-item action"
              onClick={() => navigate('/settings/install')}
            >
              <p>
                <span className="material-symbols-outlined icon">
                  add_to_home_screen
                </span>
                加入主畫面
              </p>
              <span className="material-symbols-rounded icon">
                chevron_right
              </span>
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
              onClick={() => navigate('/settings/changelog')}
            >
              <p>更新紀錄</p>
              <span className="material-symbols-rounded icon">
                chevron_right
              </span>
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
