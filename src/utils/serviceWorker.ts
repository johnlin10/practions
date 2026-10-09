/**
 * Service Worker 註冊與更新提示（Service Worker 本體在 public/sw.js）
 *
 * 只在正式建置的主畫面 App 註冊：離線是主畫面 App 的功能，瀏覽器訪客維持原本的行為，
 * 不必下載整套字型。Android 的主畫面 App 與瀏覽器共用同一個 Service Worker，
 * 所以瀏覽器分頁已被控制時也註冊，才收得到更新提示。
 *
 * 新版下載好後會停在 waiting，由 useUpdatePrompt 詢問使用者；作答中不詢問，避免重新整理讓答案消失。
 * 每個新版只詢問一次，按「稍後」之後改由設定頁的版本欄提供更新按鈕（useNewVersion）。
 */
import { useEffect, useSyncExternalStore } from 'react'
import { useLocation } from 'react-router-dom'
import { showConfirm } from './dialog'

// 下載好、等待接手的新版 Service Worker，與它的版本號（向新版詢問，回覆前為空字串）
let waiting: ServiceWorker | null = null
let waitingVersion = ''
// 已經詢問過的新版：同一個新版不再跳出提示
let asked: ServiceWorker | null = null
// 使用者按下更新：新版接手時才重新整理
let updating = false
const listeners = new Set<() => void>()

function notify(): void {
  listeners.forEach((listener) => listener())
}

function setWaiting(worker: ServiceWorker | null): void {
  if (worker === waiting) return
  waiting = worker
  waitingVersion = ''
  notify()
  if (!worker) return
  const channel = new MessageChannel()
  channel.port1.onmessage = (event) => {
    if (waiting !== worker) return
    waitingVersion = String(event.data)
    notify()
  }
  worker.postMessage({ type: 'GET_VERSION' }, [channel.port2])
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const isStandalone = (): boolean =>
  matchMedia('(display-mode: standalone)').matches ||
  (navigator as { standalone?: boolean }).standalone === true

/** 應用程式啟動時呼叫。 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  if (!isStandalone() && !navigator.serviceWorker.controller) return

  // 只有使用者按下更新才重新整理；第一次安裝時接手頁面也會觸發 controllerchange，不能重新整理
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (updating) location.reload()
  })

  navigator.serviceWorker
    .register('/sw.js')
    .then((registration) => {
      // 有舊版控制頁面時，新版才需要等待；第一次安裝直接生效，不用詢問
      const check = (): void => {
        if (registration.waiting && navigator.serviceWorker.controller)
          setWaiting(registration.waiting)
      }
      check()
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') check()
        })
      })
      // 主畫面 App 從背景切回前景不會重新載入，瀏覽器不會自己檢查更新
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return
        registration.update().catch(() => {
          // 離線時檢查失敗，下次回到前景再試
        })
        check()
      })
    })
    .catch((error) => {
      console.error('[sw] 註冊失敗：', error)
    })
}

/** 讓新版接手並重新整理頁面。 */
export function applyUpdate(): void {
  if (!waiting) return
  updating = true
  waiting.postMessage({ type: 'SKIP_WAITING' })
}

/** React hook：等待更新的新版版本號；沒有新版時為 null，還沒取得版本號時為空字串。 */
export function useNewVersion(): string | null {
  return useSyncExternalStore(subscribe, () =>
    waiting ? waitingVersion : null,
  )
}

/** App 裡呼叫：有新版時詢問一次是否更新，作答中（/quiz/:subjectId）等離開後再問。 */
export function useUpdatePrompt(): void {
  const worker = useSyncExternalStore(subscribe, () => waiting)
  const inQuiz = /^\/quiz\/./.test(useLocation().pathname)

  useEffect(() => {
    if (!worker || worker === asked || inQuiz) return
    asked = worker
    void showConfirm('更新後會重新整理頁面。之後也可以在設定頁的版本欄更新。', {
      title: 'Practions 有新版本',
      confirmText: '立即更新',
      cancelText: '稍後',
    }).then((ok) => {
      if (ok) applyUpdate()
    })
  }, [worker, inQuiz])
}
