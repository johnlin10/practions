import { useState, useCallback } from 'react'
import {
  AppSettings,
  PVQCSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
  UseSettingsReturn,
} from '../types/settings'

/**
 * useSettings Hook
 * 統一管理應用程式的設定操作
 *
 * 功能特性：
 * - 設定資料的持久化存儲
 * - 設定更新的即時同步
 * - 設定變更狀態追蹤
 * - 預設設定重置功能
 *
 * @returns {UseSettingsReturn} 設定管理的相關方法和狀態
 */
// 載入設定並合併預設值的輔助函數
function loadSettingsFromStorage(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (stored) {
      const parsedSettings = JSON.parse(stored) as AppSettings
      // 合併預設設定，確保向後兼容
      return {
        ...DEFAULT_SETTINGS,
        ...parsedSettings,
        pvqc: {
          ...DEFAULT_SETTINGS.pvqc,
          ...parsedSettings.pvqc,
        },
      }
    }
  } catch (error) {
    console.warn('載入設定時發生錯誤，使用預設設定：', error)
  }
  // 如果沒有設定或載入失敗，返回預設設定
  return DEFAULT_SETTINGS
}

export function useSettings(): UseSettingsReturn {
  // 設定狀態 - 在初始化時就從 localStorage 載入
  const [settings, setSettings] = useState<AppSettings>(loadSettingsFromStorage)
  // 是否已修改（用於UI顯示）
  const [isModified, setIsModified] = useState(false)

  // 更新設定並保存到本地存儲
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings: AppSettings = {
        ...prevSettings,
        ...newSettings,
        // 深度合併PVQC設定
        pvqc: newSettings.pvqc
          ? { ...prevSettings.pvqc, ...newSettings.pvqc }
          : prevSettings.pvqc,
      }

      // 保存到本地存儲
      try {
        localStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings)
        )
      } catch (error) {
        console.error('保存設定時發生錯誤：', error)
      }

      // 標記為已修改
      setIsModified(true)
      // 3秒後重置修改狀態
      setTimeout(() => setIsModified(false), 3000)

      return updatedSettings
    })
  }, [])

  // 重置為預設設定
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      )
      setIsModified(true)
      setTimeout(() => setIsModified(false), 3000)
    } catch (error) {
      console.error('重置設定時發生錯誤：', error)
    }
  }, [])

  return {
    settings,
    updateSettings,
    resetToDefaults,
    isModified,
  }
}

/**
 * usePVQCSettings Hook
 * 專門用於PVQC設定的便利Hook
 *
 * @returns {Object} PVQC設定相關的方法和狀態
 */
export function usePVQCSettings() {
  const { settings, updateSettings } = useSettings()

  const updatePVQCSettings = useCallback(
    (pvqcSettings: Partial<PVQCSettings>) => {
      updateSettings({ pvqc: { ...settings.pvqc, ...pvqcSettings } })
    },
    [settings.pvqc, updateSettings]
  )

  return {
    pvqcSettings: settings.pvqc,
    updatePVQCSettings,
  }
}
