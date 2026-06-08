/**
 * Practions 設定系統型別定義
 * 集中管理所有設定相關的資料結構和型別
 */

// PVQC 測驗設定介面
export interface PVQCSettings {
  // 預設題目數量（每個階段）
  defaultQuestionCount: number
  // 預設時間限制（每個階段，單位：分鐘）
  defaultTimePerStage: number
}

// 通用設定介面
export interface AppSettings {
  // PVQC 測驗設定
  pvqc: PVQCSettings
  // 未來可以擴展更多設定分類
  // ui: UISettings
  // notifications: NotificationSettings
  // etc.
}

// 設定 Hook 的返回型別
export interface UseSettingsReturn {
  // 設定資料
  settings: AppSettings
  // 更新設定
  updateSettings: (newSettings: Partial<AppSettings>) => void
  // 重置為預設設定
  resetToDefaults: () => void
  // 檢查設定是否已修改
  isModified: boolean
}

// 預設設定值
export const DEFAULT_SETTINGS: AppSettings = {
  pvqc: {
    defaultQuestionCount: 50,
    defaultTimePerStage: 10,
  },
}

// 本地存儲鍵值
export const SETTINGS_STORAGE_KEY = 'practions_settings_v1'
