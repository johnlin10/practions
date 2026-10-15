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
  // 隨手練每次幾題
  practiceLimit: number
  // 隨手練手動選的題庫 ID；空字串表示還沒選過
  practiceSubject: string
  // 手動選題庫的時間（毫秒）：之後有作答就改用最後作答的題庫
  practiceSubjectAt: number
  // 互動音效：錯題複習答對／答錯、完美作答時播放
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
  practiceLimit: 20,
  practiceSubject: '',
  practiceSubjectAt: 0,
  sound: true,
}

// 錯題複習每次題數的選項
export const REVIEW_LIMITS = [5, 10, 15, 20] as const

// 隨手練每次題數可調整的範圍（含）與每次增減的量
export const PRACTICE_LIMITS = { min: 20, max: 50, step: 5 }

// PVQC 自訂測驗可調整的範圍（含）與每次增減的量（PVQC 測驗設定頁）
export const PVQC_LIMITS = {
  questionCount: { min: 5, max: 100, step: 5 },
  timePerStage: { min: 5, max: 30, step: 5 },
}

// 本地存儲鍵值
export const SETTINGS_STORAGE_KEY = 'practions_settings_v1'
