/**
 * localStorage 資料遷移
 *
 * 集中管理跨版本的一次性遷移邏輯，取代原本散落在 App.tsx 的裸 localStorage 操作。
 * 應於應用程式啟動時呼叫一次。
 */
import { readRaw, remove, write } from '@/utils/storage'

const LEGACY_HISTORY_V2_KEY = 'quizHistory-v2'
const TRANSFER_V2_TO_V3_FLAG = 'transfer-v2-to-v3'

/**
 * 執行所有待處理的遷移（冪等，可安全重複呼叫）。
 */
export function runMigrations(): void {
  // 清理已淘汰的 v2 歷史記錄
  remove(LEGACY_HISTORY_V2_KEY)

  // v2 → v3 遷移標記：僅在首次執行時設定
  if (readRaw(TRANSFER_V2_TO_V3_FLAG)) return
  write(TRANSFER_V2_TO_V3_FLAG, true)
}
