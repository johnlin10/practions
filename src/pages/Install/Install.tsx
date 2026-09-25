import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Install.scss'
import { INSTALL_TITLE, INSTALL_DESCRIPTION } from './meta'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

const SITE_URL = 'practions.web.app'

type Platform = 'ios' | 'android'

// 安裝步驟（第一步另外渲染以附上複製按鈕）
// iOS 對應教學影片流程
const IOS_STEPS = [
  '點選網址列左側的「≡」選單，再點選「分享」',
  '展開更多選項，點選「加入主畫面」',
  '確認已開啟「以網頁 App 打開」，點選右上角「加入」',
  '從主畫面開啟 Practions，即可全螢幕使用',
]
const ANDROID_STEPS = [
  '點選右上角的「⋮」選單',
  '點選「安裝應用程式」或「加到主畫面」',
  '在跳出的視窗點選「安裝」',
  '從主畫面或應用程式列表開啟 Practions，即可全螢幕使用',
]

/**
 * [component] CopyUrlButton
 * 複製網站網址的小按鈕，複製後短暫顯示打勾圖示
 */
function CopyUrlButton(): React.ReactElement {
  const [copied, setCopied] = useState<boolean>(false)

  const copyUrl = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(`https://${SITE_URL}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 瀏覽器不允許存取剪貼簿時，使用者仍可手動輸入網址
    }
  }

  return (
    <button
      className="copy-button"
      onClick={copyUrl}
      aria-label={copied ? '已複製網址' : '複製網址'}
    >
      <span className="material-symbols-rounded">
        {copied ? 'check' : 'content_copy'}
      </span>
    </button>
  )
}

/**
 * [page] Install component
 * 教學頁面：在 iOS / Android 將 Practions 加入主畫面（安裝 PWA）
 */
function Install(): React.ReactElement {
  // 進入頁面時設定標題與描述，離開時還原
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    const prevTitle = document.title
    const prevDescription = meta?.content
    document.title = INSTALL_TITLE
    if (meta) meta.content = INSTALL_DESCRIPTION
    return () => {
      document.title = prevTitle
      if (meta && prevDescription !== undefined) meta.content = prevDescription
    }
  }, [])

  // 預設顯示使用者裝置對應的教學，其餘（iPhone、電腦）預設 iOS
  const [platform, setPlatform] = useState<Platform>(() =>
    /android/i.test(navigator.userAgent) ? 'android' : 'ios',
  )
  // Chrome 系瀏覽器可直接跳出安裝視窗
  const { canInstall, install } = useInstallPrompt()
  const [installed, setInstalled] = useState<boolean>(false)

  const handleInstall = async (): Promise<void> => {
    if (await install()) setInstalled(true)
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          加入主畫面
        </h1>
        <p>
          將 Practions 加入手機主畫面，像 App
          一樣全螢幕使用，測驗紀錄也會長期保存，不會因為一段時間沒開啟就被清除。
        </p>

        {/* 平台切換（沿用 PVQC 設定頁的切換樣式） */}
        <div className="setup-mode-switch">
          <button
            className={`setup-mode-tab ${platform === 'ios' ? 'active' : ''}`}
            onClick={() => setPlatform('ios')}
          >
            <span className="material-symbols-rounded">phone_iphone</span>
            iPhone
          </button>
          <button
            className={`setup-mode-tab ${
              platform === 'android' ? 'active' : ''
            }`}
            onClick={() => setPlatform('android')}
          >
            <span className="material-symbols-rounded">android</span>
            Android
          </button>
        </div>

        {platform === 'ios' ? (
          <div className="install">
            <video
              className="install-video"
              src="/videos/install-pwa.mp4"
              poster="/videos/install-pwa-poster.jpg"
              autoPlay
              loop
              muted
              playsInline
              aria-label="在 Safari 將 Practions 加入主畫面的操作示範影片"
            />
            <ol className="install-steps">
              <li>
                使用 Safari 開啟 {SITE_URL}
                <CopyUrlButton />
              </li>
              {IOS_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="install android">
            {installed ? (
              <p className="install-status">
                <span className="material-symbols-rounded">check_circle</span>
                已安裝，可以從主畫面開啟 Practions
              </p>
            ) : (
              canInstall && (
                <>
                  <button className="install-button" onClick={handleInstall}>
                    <span className="material-symbols-rounded">
                      install_mobile
                    </span>
                    安裝 Practions
                  </button>
                  <p className="install-hint">或依照以下步驟手動安裝：</p>
                </>
              )
            )}
            <ol className="install-steps">
              <li>
                使用 Chrome 開啟 {SITE_URL}
                <CopyUrlButton />
              </li>
              {ANDROID_STEPS.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}

export default Install
