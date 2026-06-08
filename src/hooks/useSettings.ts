import { useCallback, useState } from 'react'
import type {
  AppSettings,
  PVQCSettings,
  UseSettingsReturn,
} from '@/types/settings'
import {
  resetSettings,
  updatePVQCSettings as updatePVQCSettingsStore,
  updateSettings as updateSettingsStore,
  useSettingsStore,
} from '@/data/settingsStore'

/**
 * useSettings Hook
 * 統一管理應用程式的設定操作。
 *
 * 背後由 settingsStore（單一資料來源）驅動，所有元件即時同步。
 */
export function useSettings(): UseSettingsReturn {
  const settings = useSettingsStore()
  // isModified 為 UI 回饋用的本地狀態（顯示「已儲存」提示），不需跨元件共享
  const [isModified, setIsModified] = useState(false)

  const flagModified = useCallback(() => {
    setIsModified(true)
    setTimeout(() => setIsModified(false), 3000)
  }, [])

  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      updateSettingsStore(newSettings)
      flagModified()
    },
    [flagModified],
  )

  const resetToDefaults = useCallback(() => {
    resetSettings()
    flagModified()
  }, [flagModified])

  return {
    settings,
    updateSettings,
    resetToDefaults,
    isModified,
  }
}

/**
 * usePVQCSettings Hook
 * 專門用於 PVQC 設定的便利 Hook。
 */
export function usePVQCSettings() {
  const settings = useSettingsStore()

  const updatePVQCSettings = useCallback((pvqcSettings: Partial<PVQCSettings>) => {
    updatePVQCSettingsStore(pvqcSettings)
  }, [])

  return {
    pvqcSettings: settings.pvqc,
    updatePVQCSettings,
  }
}
