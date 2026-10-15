/**
 * 條款更新通知：LEGAL_UPDATED 改變後，舊使用者下次開啟時跳一次提示（只有「我知道了」）。
 * 新使用者第一次開啟不跳，直接記為已看過。需在 runMigrations 之前呼叫，
 * 才分得出是不是第一次開啟（runMigrations 會寫入 v2 → v3 遷移標記）。
 */
import { LEGAL_UPDATED } from './meta'
import { TRANSFER_V2_TO_V3_FLAG } from '@/data/migrations'
import { STORAGE_KEYS } from '@/types'
import { SETTINGS_STORAGE_KEY } from '@/types/settings'
import { readRaw, write } from '@/utils/storage'
import { showAlert } from '@/utils/dialog'

const LEGAL_SEEN_KEY = 'legalNoticeSeen'
// 開發模式的 StrictMode 會執行兩次 effect，避免排進兩個彈窗
let checked = false

export function showLegalNoticeOnce(): void {
  if (checked) return
  checked = true
  if (readRaw(LEGAL_SEEN_KEY) === JSON.stringify(LEGAL_UPDATED)) return
  const returning = [
    TRANSFER_V2_TO_V3_FLAG,
    STORAGE_KEYS.QUIZ_HISTORY,
    SETTINGS_STORAGE_KEY,
  ].some((key) => readRaw(key) !== null)
  const markSeen = () => write(LEGAL_SEEN_KEY, LEGAL_UPDATED)
  if (!returning) return markSeen()
  void showAlert(
    '聯絡信箱改為 support@practions.app，並調整了服務介紹與部分文字。\n\n繼續使用 Practions 即表示您同意更新後的內容，完整條文可以在「設定」頁查看。',
    { title: '服務條款與隱私權政策已更新', confirmText: '我知道了' },
  ).then(markSeen)
}
