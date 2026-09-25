import { useSyncExternalStore } from 'react'

// Chrome 系瀏覽器（Android Chrome、Samsung Internet、Edge）才有的事件，TS 內建型別沒有
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// 模組載入時（App 啟動）就開始監聽：瀏覽器在頁面載入後才發出這個事件，
// 等使用者切到教學頁才監聽會錯過
let deferredPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = (): void => listeners.forEach((listener) => listener())

window.addEventListener('beforeinstallprompt', (e) => {
  deferredPrompt = e as BeforeInstallPromptEvent
  notify()
})
window.addEventListener('appinstalled', () => {
  deferredPrompt = null
  notify()
})

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * useInstallPrompt Hook
 * 瀏覽器判定可安裝時 canInstall 為 true，呼叫 install() 跳出系統的安裝視窗
 */
export function useInstallPrompt(): {
  canInstall: boolean
  install: () => Promise<boolean>
} {
  const canInstall = useSyncExternalStore(
    subscribe,
    () => deferredPrompt !== null,
  )

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    const event = deferredPrompt
    // 每個事件只能 prompt 一次；使用者取消後，瀏覽器之後會再發出新的事件
    deferredPrompt = null
    notify()
    await event.prompt()
    const { outcome } = await event.userChoice
    return outcome === 'accepted'
  }

  return { canInstall, install }
}
