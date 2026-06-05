/**
 * 設定資料層（單一資料來源）
 *
 * 修正先前 useSettings 每次呼叫各自建立獨立 state 的問題：
 * 改用 module-level cache + useSyncExternalStore，讓 Settings 頁與 PVQCSetup 等
 * 所有消費端讀同一份設定，任一處更新即時同步。
 */
import { useSyncExternalStore } from 'react'
import type { AppSettings, PVQCSettings } from '@/types/settings'
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from '@/types/settings'
import { appSettingsSchema } from '@/schemas/settings'
import { readValidated, write } from '@/utils/storage'

let cache: AppSettings | null = null
const listeners = new Set<() => void>()

function load(): AppSettings {
  // schema 內各欄位帶 default，部分/舊版設定會自動補齊缺漏欄位
  return readValidated(SETTINGS_STORAGE_KEY, appSettingsSchema, DEFAULT_SETTINGS)
}

function getSnapshot(): AppSettings {
  if (cache === null) cache = load()
  return cache
}

function emit(): void {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** 取得目前設定。 */
export function getSettings(): AppSettings {
  return getSnapshot()
}

/** 更新設定（淺合併頂層、深合併 pvqc），持久化並通知訂閱者。 */
export function updateSettings(partial: Partial<AppSettings>): void {
  const prev = getSnapshot()
  cache = {
    ...prev,
    ...partial,
    pvqc: partial.pvqc ? { ...prev.pvqc, ...partial.pvqc } : prev.pvqc,
  }
  write(SETTINGS_STORAGE_KEY, cache)
  emit()
}

/** 更新 PVQC 設定的便利方法。 */
export function updatePVQCSettings(partial: Partial<PVQCSettings>): void {
  updateSettings({ pvqc: { ...getSnapshot().pvqc, ...partial } })
}

/** 重置為預設設定。 */
export function resetSettings(): void {
  cache = DEFAULT_SETTINGS
  write(SETTINGS_STORAGE_KEY, cache)
  emit()
}

/** React hook：訂閱設定，內容變動時自動重渲染。 */
export function useSettingsStore(): AppSettings {
  return useSyncExternalStore(subscribe, getSnapshot)
}
