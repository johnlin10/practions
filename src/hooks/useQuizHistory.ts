import { useCallback } from 'react'
import type { HistoryRecord } from '@/types'
import {
  addHistoryRecord as addHistoryRecordStore,
  clearHistory as clearHistoryStore,
  getHistoryById,
  useHistoryStore,
} from '@/data/historyStore'

/**
 * useQuizHistory Hook
 * 統一管理測驗歷史記錄的讀寫，背後由 historyStore（單一資料來源）驅動。
 * 任一處新增/清除後，所有使用此 hook 的元件即時同步。
 */
export function useQuizHistory() {
  const history = useHistoryStore()

  const addRecord = useCallback((record: HistoryRecord) => {
    addHistoryRecordStore(record)
  }, [])

  const clearHistory = useCallback(() => {
    clearHistoryStore()
  }, [])

  const getById = useCallback(
    (id: string): HistoryRecord | undefined => getHistoryById(id),
    [],
  )

  return {
    history,
    addRecord,
    clearHistory,
    getById,
  }
}
