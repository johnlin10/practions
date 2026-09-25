import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './InstallBanner.scss'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

// 使用者關閉提示後，隔一段時間才再顯示
const DISMISS_KEY = 'installBannerDismissedAt'
const DISMISS_DAYS = 14

const isDismissed = (): boolean => {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY))
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

// 是否從主畫面開啟（已安裝的 PWA）：Android 看 display-mode，iOS Safari 看 navigator.standalone
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

// iPhone / iPad 的瀏覽器（iOS 沒有安裝事件，只能引導到教學頁）
// iPadOS 的 User-Agent 偽裝成 Mac，改用觸控點數判斷
const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

// Android Chrome 才有；manifest 的 related_applications 需列出自己，才查得到自己的 PWA
type NavigatorWithRelatedApps = Navigator & {
  getInstalledRelatedApps?: () => Promise<unknown[]>
}

/**
 * [component] InstallBanner
 * 在瀏覽器（非主畫面）開啟時自動顯示提示：
 * - 瀏覽器判定可安裝（收到 beforeinstallprompt）：提供一鍵安裝按鈕
 * - 已安裝但仍用瀏覽器開啟（Android Chrome 可偵測）：提醒從主畫面開啟
 * - iOS 無法一鍵安裝，也偵測不到是否已安裝：提供按鈕前往加入主畫面教學頁
 */
function InstallBanner(): React.ReactElement | null {
  const navigate = useNavigate()
  const { canInstall, install } = useInstallPrompt()
  const [dismissed, setDismissed] = useState<boolean>(isDismissed)
  const [installed, setInstalled] = useState<boolean>(false)

  useEffect(() => {
    if (isStandalone) return
    ;(navigator as NavigatorWithRelatedApps)
      .getInstalledRelatedApps?.()
      .then((apps) => setInstalled(apps.length > 0))
      .catch(() => {
        // 查詢失敗時當作未安裝
      })
  }, [])

  const dismiss = (): void => {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()))
    } catch {
      // 無法寫入時，只在這次瀏覽期間隱藏
    }
  }

  if (dismissed || isStandalone) return null

  let content: { title: string; text: string; action?: React.ReactElement }
  if (canInstall) {
    content = {
      title: '安裝 Practions',
      text: '全螢幕使用，測驗紀錄長期保存',
      action: (
        <button className="install-banner-install" onClick={install}>
          安裝
        </button>
      ),
    }
  } else if (installed) {
    // 無法從網頁直接開啟已安裝的 PWA（套件名稱由 Chrome 產生），只能提醒
    content = {
      title: '已安裝 Practions',
      text: '從主畫面開啟，全螢幕使用更方便',
    }
  } else if (isIOS) {
    content = {
      title: '加入主畫面',
      text: '全螢幕使用，測驗紀錄長期保存',
      action: (
        <button
          className="install-banner-install"
          onClick={() => navigate('/settings/install')}
        >
          看教學
        </button>
      ),
    }
  } else {
    return null
  }

  return (
    <div className="install-banner" role="dialog" aria-label={content.title}>
      <img src="/icons/r/practions-r-128.png" alt="" />
      <div className="install-banner-text">
        <h3>{content.title}</h3>
        <p>{content.text}</p>
      </div>
      {content.action}
      <button
        className="install-banner-close"
        onClick={dismiss}
        aria-label="關閉提示"
      >
        <span className="material-symbols-rounded">close</span>
      </button>
    </div>
  )
}

export default InstallBanner
