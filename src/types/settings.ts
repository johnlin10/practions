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

// 主題：跟隨系統（自動模式），或手動指定淺色 / 深色
export type ThemeSetting = 'system' | 'light' | 'dark'

// 通用設定介面
export interface AppSettings {
  // PVQC 測驗設定
  pvqc: PVQCSettings
  // 主題
  theme: ThemeSetting
  // 錯題複習每次最多幾題
  reviewLimit: number
  // 錯題複習答對／答錯時播放音效
  sound: boolean
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
  theme: 'system',
  reviewLimit: 15,
  sound: true,
}

// 錯題複習每次題數的選項
export const REVIEW_LIMITS = [5, 10, 15, 20] as const

// PVQC 自訂測驗可調整的範圍（含）與每次增減的量，設定頁與測驗設定頁共用
export const PVQC_LIMITS = {
  questionCount: { min: 5, max: 50, step: 5 },
  timePerStage: { min: 5, max: 30, step: 5 },
}

// 本地存儲鍵值
export const SETTINGS_STORAGE_KEY = 'practions_settings_v1'
