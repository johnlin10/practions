/**
 * 主題（淺色 / 深色）
 *
 * 實際主題由設定（跟隨系統 / 手動）與系統深淺色決定，套用為 <html data-theme>，
 * theme.css 依 data-theme 切換色值。首次繪製前由 index.html 的內嵌腳本先套用一次，
 * 兩邊的判斷邏輯需保持一致。
 */
import { useSyncExternalStore } from 'react'
import { getSettings, subscribeSettings } from '@/data/settingsStore'

export type ResolvedTheme = 'light' | 'dark'

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')

/** 系統目前的深淺色。 */
export function getSystemTheme(): ResolvedTheme {
  return darkQuery.matches ? 'dark' : 'light'
}

/** 實際套用的主題：自動模式時跟隨系統，否則為使用者的選擇。 */
export function getResolvedTheme(): ResolvedTheme {
  const theme = getSettings().theme
  return theme === 'system' ? getSystemTheme() : theme
}

/** 設定或系統深淺色改變時通知。 */
function subscribeTheme(onChange: () => void): () => void {
  darkQuery.addEventListener('change', onChange)
  const unsubscribeSettings = subscribeSettings(onChange)
  return () => {
    darkQuery.removeEventListener('change', onChange)
    unsubscribeSettings()
  }
}

/** React hook：實際套用的主題，改變時重渲染。 */
export function useResolvedTheme(): ResolvedTheme {
  return useSyncExternalStore(subscribeTheme, getResolvedTheme)
}

function applyTheme(): void {
  const root = document.documentElement
  root.dataset.theme = getResolvedTheme()
  // 瀏覽器網址列 / 狀態列顏色與頁面背景一致
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute(
      'content',
      getComputedStyle(root).getPropertyValue('--background-color').trim(),
    )
}

/** 套用主題，並在設定或系統深淺色改變時重新套用。 */
export function initTheme(): void {
  applyTheme()
  subscribeTheme(applyTheme)
}
