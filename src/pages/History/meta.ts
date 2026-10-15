import type { FlowMode } from '@/types/quiz-flows'

/** 練習的紀錄（錯題複習）放在練習頁，其餘放在測驗頁。 */
export const isPracticeRecord = (flowMode?: FlowMode): boolean =>
  flowMode === 'review'

/** 這種紀錄的列表網址；單筆紀錄在後面加上 `/紀錄 ID`。 */
export const historyPath = (flowMode?: FlowMode): string =>
  isPracticeRecord(flowMode) ? '/practice/history' : '/history'
