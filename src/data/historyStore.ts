/**
 * 歷史記錄資料層（單一資料來源）
 *
 * 集中所有對 QUIZ_HISTORY 的讀寫，取代原本散落在 4 個元件的 localStorage 直接存取。
 * 以 module-level cache + useSyncExternalStore 對外，讓所有讀取點即時同步
 * （例如 Settings 清空後 History 立即反映）。
 *
 * 讀取時逐筆以 zod 驗證，壞掉的單筆會被略過並 warn，不影響其餘記錄。
 */
import { useSyncExternalStore } from 'react'
import type { HistoryRecord } from '@/types'
import { STORAGE_KEYS } from '@/types'
import { historyRecordSchema } from '@/schemas/history'
import { write } from '@/utils/storage'

let cache: HistoryRecord[] | null = null
const listeners = new Set<() => void>()

/**
 * 從 localStorage 載入並逐筆驗證。壞掉的記錄略過。
 */
function load(): HistoryRecord[] {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)
  } catch (error) {
    console.warn('[historyStore] 讀取 localStorage 失敗：', error)
    return []
  }
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    console.warn('[historyStore] JSON 解析失敗，視為空紀錄：', error)
    return []
  }
  if (!Array.isArray(parsed)) {
    console.warn('[historyStore] 歷史記錄非陣列，視為空紀錄')
    return []
  }

  const valid: HistoryRecord[] = []
  parsed.forEach((item, index) => {
    const result = historyRecordSchema.safeParse(item)
    if (result.success) {
      // envelope 已驗證，深層結構沿用既有型別
      valid.push(result.data as unknown as HistoryRecord)
    } else {
      console.warn(
        `[historyStore] 略過第 ${index} 筆無效記錄：`,
        result.error.issues,
      )
    }
  })
  return valid
}

function getSnapshot(): HistoryRecord[] {
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

/** 取得全部歷史記錄（依寫入順序，最舊在前）。 */
export function getAllHistory(): HistoryRecord[] {
  return getSnapshot()
}

/** 依 id 取得單筆記錄。 */
export function getHistoryById(id: string): HistoryRecord | undefined {
  return getSnapshot().find((record) => record.id === id)
}

/** 新增一筆記錄並持久化、通知所有訂閱者。 */
export function addHistoryRecord(record: HistoryRecord): void {
  cache = [...getSnapshot(), record]
  write(STORAGE_KEYS.QUIZ_HISTORY, cache)
  emit()
}

/** 清空全部記錄並持久化、通知所有訂閱者。 */
export function clearHistory(): void {
  cache = []
  write(STORAGE_KEYS.QUIZ_HISTORY, cache)
  emit()
}

/**
 * React hook：訂閱歷史記錄，內容變動時自動重渲染。
 * 回傳的陣列為唯讀快照，請勿直接 mutate（需要排序/反轉時先複製）。
 */
export function useHistoryStore(): HistoryRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
