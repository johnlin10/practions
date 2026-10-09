/**
 * Service Worker：讓主畫面 App 離線也能使用
 *
 * - install：把整個 App（程式、樣式、字型、題庫）下載進這個版本的快取
 * - activate：刪除舊版本的快取
 * - fetch：預先快取過的檔案從快取回傳；頁面導覽一律回傳快取的 index.html（SPA）
 *
 * 更新流程：部署後這個檔案的 VERSION 會變，瀏覽器下載新版後進入 waiting，
 * 等使用者在更新提示按下更新（SKIP_WAITING），才接手並重新整理頁面，不會打斷作答。
 * 只在主畫面 App 註冊，見 src/utils/serviceWorker.ts。
 *
 * 出問題時的緊急處理：把這個檔案換成只做 self.registration.unregister() 的版本部署，
 * 所有使用者下次開啟時就會解除註冊。檔名 /sw.js 不能改，否則舊的 Service Worker 不會更新。
 */

// 建置時由 vite.config.ts 填入：VERSION 是預先快取檔案內容的 hash，PRECACHE 是檔案清單，
// APP_VERSION 是 package.json 的版本號（設定頁顯示要更新到哪一版）
const VERSION = 'dev'
const APP_VERSION = 'dev'
const PRECACHE = []

const CACHE_PREFIX = 'practions-'
const CACHE = CACHE_PREFIX + VERSION
const PRECACHED = new Set(PRECACHE)

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await Promise.all(
        PRECACHE.map(async (url) => {
          // /assets/ 的檔名帶 hash，內容不會變：舊版快取裡有就沿用，不重新下載
          const cached = url.startsWith('/assets/') && (await caches.match(url))
          const response = cached || (await fetch(url, { cache: 'reload' }))
          // 任何一個檔案失敗就整個安裝失敗，下次開啟再試，不會留下缺檔的版本
          if (!response.ok) throw new Error(`預先快取失敗：${url}`)
          await cache.put(url, response)
        }),
      )
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
          .map((key) => caches.delete(key)),
      )
      // 第一次安裝時讓目前開著的頁面也由 Service Worker 控制，不用重開才能離線
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage(APP_VERSION)
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== location.origin) return
  // Firebase 登入流程（/__/auth/handler 等）一律走網路，否則導向登入回來會拿到 index.html
  if (url.pathname.startsWith('/__/')) return

  if (request.mode === 'navigate') {
    event.respondWith(fromCache('/index.html', request))
  } else if (PRECACHED.has(url.pathname)) {
    event.respondWith(fromCache(url.pathname, request))
  }
  // 其他請求（教學影片、截圖等）不攔截，照瀏覽器原本的方式處理
})

/** 從這個版本的快取回傳；快取不見了（例如被系統清除）就改走網路。 */
async function fromCache(path, request) {
  const cache = await caches.open(CACHE)
  return (await cache.match(path)) || fetch(request)
}
