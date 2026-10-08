import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Settings.scss'
import packageJson from '../../../package.json'
import { DEFAULT_SETTINGS, PVQC_LIMITS } from '../../types'
import Stepper from '../../components/Stepper/Stepper'
import { usePVQCSettings } from '../../hooks/useSettings'
import { useQuizHistory } from '@/hooks/useQuizHistory'
import { downloadBackup, importBackup } from '@/utils/backup'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import {
  deleteAccount,
  isLegacySite,
  signIn,
  signOut,
  useAuth,
} from '@/data/authStore'
import { showAlert, showConfirm } from '@/utils/dialog'
import {
  getSystemTheme,
  useResolvedTheme,
  type ResolvedTheme,
} from '@/utils/theme'

const THEME_OPTIONS: { value: ResolvedTheme; label: string; icon: string }[] = [
  { value: 'light', label: '淺色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
]

// 帳號列的同步狀態
const SYNC_LABELS = {
  synced: { icon: 'check', label: '已同步' },
  syncing: { icon: 'sync', label: '同步中' },
  offline: { icon: 'cloud_off', label: '離線' },
} as const

/** Google 標誌（官方配色） */
function GoogleIcon(): React.ReactElement {
  return (
    <svg className="google-icon" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}

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
  const [avatarFailed, setAvatarFailed] = useState<boolean>(false)

  const handleSignIn = async (): Promise<void> => {
    if (authBusy || auth.status !== 'guest') return
    setAuthBusy(true)
    try {
      await signIn()
    } catch (error) {
      void showAlert((error as Error).message)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSignOut = async (): Promise<void> => {
    if (authBusy) return
    const ok = await showConfirm('測驗紀錄會保留在雲端，下次登入即可看到。', {
      title: '確定要登出嗎？',
      confirmText: '登出',
    })
    if (!ok) return
    setAuthBusy(true)
    try {
      await signOut()
    } catch (error) {
      void showAlert((error as Error).message)
      setAuthBusy(false)
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    if (authBusy) return
    const ok = await showConfirm(
      `您在 Practions 的帳號與所有雲端測驗紀錄${
        hasHistory ? `（${history.length} 筆）` : ''
      }都會永久刪除，這台裝置上的紀錄也會一併清除，且無法復原。\n\n需要保留紀錄的話，請先匯出測驗紀錄。`,
      {
        title: '確定要刪除帳號嗎？',
        confirmText: '刪除帳號',
        danger: true,
      },
    )
    if (!ok) return
    setAuthBusy(true)
    try {
      // 成功時會重新整理頁面；取消確認身分時恢復按鈕
      if (!(await deleteAccount())) setAuthBusy(false)
    } catch (error) {
      void showAlert((error as Error).message)
      setAuthBusy(false)
    }
  }

  const clearHistory = async (): Promise<void> => {
    const ok = await showConfirm(
      signedIn
        ? '雲端與所有裝置上的紀錄都會一併刪除，且無法復原。'
        : '清除後無法復原。',
      {
        title: `確定要清除 ${history.length} 筆測驗紀錄嗎？`,
        confirmText: '清除',
        danger: true,
      },
    )
    if (ok) clearAllHistory()
  }

  const handleClearHistoryClick = (): void => {
    if (!hasHistory) return
    void clearHistory()
  }

  const handleExportClick = (): void => {
    if (hasHistory) void downloadBackup()
  }

  const importInputRef = useRef<HTMLInputElement>(null)
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    // 清空讓同一個檔案可以再選一次
    e.target.value = ''
    if (file) void importBackup(file)
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
            {isLegacySite ? (
              <>
                {/* 先說明為什麼，再依順序列出動作：先轉移紀錄，再前往新網址 */}
                <div className="settings-list-group-item notice">
                  <p>
                    <span className="material-symbols-outlined icon">info</span>
                    <span>
                      網址已改為
                      practions.app，登入功能只在新網址提供。請先轉移測驗紀錄，再到新網址登入。
                    </span>
                  </p>
                </div>
                <div
                  className="settings-list-group-item action"
                  onClick={() => navigate('/settings/transfer')}
                >
                  <p>
                    <span className="material-symbols-outlined icon">
                      swap_horiz
                    </span>
                    如何轉移資料
                  </p>
                  <span className="material-symbols-rounded icon">
                    chevron_right
                  </span>
                </div>
                <div
                  className="settings-list-group-item action"
                  onClick={() => openLink('https://practions.app')}
                >
                  <p>
                    <span className="material-symbols-outlined icon">
                      open_in_new
                    </span>
                    前往新網址 practions.app
                  </p>
                </div>
              </>
            ) : signedIn ? (
              <>
                <div className="settings-list-group-item account">
                  <p>
                    {auth.photoURL && !avatarFailed ? (
                      <img
                        className="avatar"
                        src={auth.photoURL}
                        alt=""
                        // Google 頭像帶 Referer 時可能被拒
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span className="material-symbols-outlined icon">
                        account_circle
                      </span>
                    )}
                    <span className="email" title={auth.email}>
                      {auth.email}
                    </span>
                  </p>
                  <p className="info">
                    <span className="material-symbols-outlined icon">
                      {SYNC_LABELS[auth.sync ?? 'syncing'].icon}
                    </span>
                    {SYNC_LABELS[auth.sync ?? 'syncing'].label}
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
                  <GoogleIcon />
                  {auth.status === 'checking'
                    ? '正在確認登入狀態'
                    : '使用 Google 登入'}
                </p>
              </div>
            )}
            {auth.error && (
              <div className="settings-list-group-item">
                <p className="info">{auth.error}</p>
              </div>
            )}
          </div>
          {!isLegacySite && !signedIn && (
            <p className="settings-list-note">
              登入後，測驗紀錄會自動同步到雲端，換裝置也看得到。登入即表示同意
              <Link to="/settings/terms">使用條款</Link>與
              <Link to="/settings/privacy">隱私權政策</Link>。
            </p>
          )}

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
              className="settings-list-group-item action"
              onClick={() => navigate('/settings/transfer')}
            >
              <p>
                <span className="material-symbols-outlined icon">
                  swap_horiz
                </span>
                如何轉移資料
              </p>
              <span className="material-symbols-rounded icon">
                chevron_right
              </span>
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
          <div className="settings-list-group has-title">
            <h5>條款與隱私政策</h5>
            <div
              className="settings-list-group-item action"
              onClick={() => navigate('/settings/terms')}
            >
              <p>使用條款</p>
              <span className="material-symbols-rounded icon">
                chevron_right
              </span>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => navigate('/settings/privacy')}
            >
              <p>隱私權政策</p>
              <span className="material-symbols-rounded icon">
                chevron_right
              </span>
            </div>
          </div>
          {/* 不常用的操作放最下面，避免太顯眼 */}
          {signedIn && (
            <div className="settings-list-group has-title">
              <h5>帳號管理</h5>
              <div
                className={`settings-list-group-item action ${
                  authBusy ? 'disabled' : ''
                }`}
                onClick={handleDeleteAccount}
              >
                <p>
                  <span className="material-symbols-outlined icon">
                    person_remove
                  </span>
                  刪除帳號
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="copyright">
          <p>© 2025 Practions. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
