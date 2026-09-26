import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.scss'
import App from '@/App'
import { BrowserRouter } from 'react-router-dom'
import { QuizProvider } from '@/context/QuizContext'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <QuizProvider>
          <App />
        </QuizProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)

// 從主畫面開啟（PWA）時，首屏至少顯示 SPLASH_MIN_MS（從開啟頁面起算），再淡出露出畫面
// 瀏覽器開啟時首屏已由 CSS 隱藏，直接移除
const SPLASH_MIN_MS = 1000
const splash = document.querySelector('.splash')
if (splash && !window.matchMedia('(display-mode: standalone)').matches) {
  splash.remove()
} else if (splash) {
  setTimeout(
    () => {
      splash.classList.add('hide')
      setTimeout(() => splash.remove(), 500) // 對應 index.html 的 transition 時間
    },
    Math.max(0, SPLASH_MIN_MS - performance.now()),
  )
}
