import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Install.scss'
import { INSTALL_TITLE, INSTALL_DESCRIPTION } from './meta'

const SITE_URL = 'practions.web.app'

// 安裝步驟（對應教學影片流程，第一步另外渲染以附上複製按鈕）
const STEPS = [
  '點選網址列左側的「≡」選單，再點選「分享」',
  '展開更多選項，點選「加入主畫面」',
  '確認已開啟「以網頁 App 打開」，點選右上角「加入」',
  '從主畫面開啟 Practions，即可全螢幕使用',
]

/**
 * [page] Install component
 * 教學頁面：在 iOS 將 Practions 加入主畫面（安裝 PWA）
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

  // 是否剛複製網址（短暫顯示打勾圖示）
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
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          加入主畫面
        </h1>
        <p>在 iPhone 上將 Practions 加入主畫面，像 App 一樣全螢幕使用。</p>

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
              <button
                className="copy-button"
                onClick={copyUrl}
                aria-label={copied ? '已複製網址' : '複製網址'}
              >
                <span className="material-symbols-rounded">
                  {copied ? 'check' : 'content_copy'}
                </span>
              </button>
            </li>
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

export default Install
