/**
 * 歷史記錄資料層（單一資料來源）
 *
 * 集中所有對 QUIZ_HISTORY 的讀寫，取代原本散落在 4 個元件的 localStorage 直接存取。
 * 以 module-level cache + useSyncExternalStore 對外，讓所有讀取點即時同步
 * （例如 Settings 清空後 History 立即反映）。
 *
 * 讀取時逐筆以 zod 驗證，壞掉的單筆不顯示並 warn，但仍原樣保留在 localStorage。
 *
 * 題目快照去重：新記錄的每題只存快照鍵（科目 id/題目 id#內容雜湊），
 * 題目內容存在 QUESTION_SNAPSHOTS，同一版本只存一份。題庫修改後雜湊不同，
 * 會存成新快照，舊記錄仍指向舊快照，顯示與交卷當下相同。分數照存不重算。
 *
 * 舊記錄原樣保留：raw 保存 localStorage 讀到的原始物件，寫回時位元組不變；
 * 每題都帶 question 全文的舊記錄完全不經過補題。
 */
import { useSyncExternalStore } from 'react'
import type { DetailedQuestionResult, HistoryRecord } from '@/types'
import { STORAGE_KEYS } from '@/types'
import { historyRecordSchema } from '@/schemas/history'
import { write } from '@/utils/storage'
import { subjects } from '@/data/subjects'
import type { Question } from '@/types/questions'

// 寫入 localStorage 的原始物件（舊記錄不經任何轉換）
let raw: unknown[] = []
// 快照鍵 → 題目內容（原樣保留讀到的全部內容，寫回時只增不改）
let snapshots: Record<string, Question> = {}
// 給畫面用的記錄（新記錄已補回題目）
let cache: HistoryRecord[] | null = null
const listeners = new Set<() => void>()

/** 讀取 localStorage 的 JSON，失敗回傳 undefined。 */
function readJson(key: string): unknown {
  try {
    const text = localStorage.getItem(key)
    return text ? JSON.parse(text) : undefined
  } catch (error) {
    console.warn(`[historyStore] 讀取 ${key} 失敗：`, error)
    return undefined
  }
}

/**
 * 從 localStorage 載入並逐筆驗證。壞掉的記錄略過。
 */
function load(): HistoryRecord[] {
  const storedSnapshots = readJson(STORAGE_KEYS.QUESTION_SNAPSHOTS)
  snapshots =
    storedSnapshots && typeof storedSnapshots === 'object'
      ? (storedSnapshots as Record<string, Question>)
      : {}

  raw = []
  const parsed = readJson(STORAGE_KEYS.QUIZ_HISTORY)
  if (parsed === undefined) return []
  if (!Array.isArray(parsed)) {
    console.warn('[historyStore] 歷史記錄非陣列，視為空紀錄')
    return []
  }

  const valid: HistoryRecord[] = []
  parsed.forEach((item, index) => {
    // 無效記錄也原樣留在 raw，寫回時不會被刪掉
    raw.push(item)
    const result = historyRecordSchema.safeParse(item)
    if (result.success) {
      // envelope 已驗證，深層結構沿用既有型別
      const record = result.data as unknown as HistoryRecord
      try {
        valid.push(hydrate(record))
      } catch (error) {
        // 結構異常時退回原樣顯示（與瘦身前行為相同）
        console.warn(`[historyStore] 第 ${index} 筆補題失敗：`, error)
        valid.push(record)
      }
    } else {
      console.warn(
        `[historyStore] 略過第 ${index} 筆無效記錄：`,
        result.error.issues,
      )
    }
  })
  return valid
}

type StoredResult = Omit<DetailedQuestionResult, 'question'> & {
  question?: Question
  snapshot?: string
}

/**
 * 題目內容的雜湊（FNV-1a 32-bit）。
 * ponytail: 32-bit，碰撞只在「同一題的兩個版本」之間才有影響，機率可忽略
 */
function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/** 瘦身：題目內容移到快照，記錄只留快照鍵、作答與分數。只用在新記錄。 */
function slim(record: HistoryRecord): unknown {
  const strip = (results: DetailedQuestionResult[]): StoredResult[] =>
    results.map(({ question, ...r }) => {
      const key = `${record.subject.id}/${question.id}#${hash(JSON.stringify(question))}`
      snapshots[key] ??= question
      return { ...r, snapshot: key }
    })
  const { results } = record
  return {
    ...record,
    results: {
      ...results,
      questionResults:
        results.questionResults && strip(results.questionResults),
      stageResults: results.stageResults?.map((stage) => ({
        ...stage,
        questionResults: strip(stage.questionResults),
      })),
    },
  }
}

/**
 * 補題：只處理缺 question 的結果。依序從快照、目前題庫（依題目 id）找回，
 * 都找不到就略過該題（分數仍以記錄內的統計為準）。
 * 每題都帶 question 的舊記錄原物件回傳，不做任何轉換。
 */
function hydrate(record: HistoryRecord): HistoryRecord {
  const results = record.results as
    | {
        questionResults?: StoredResult[]
        stageResults?: { questionResults: StoredResult[] }[]
      }
    | undefined
  const lists = [
    results?.questionResults,
    ...(results?.stageResults?.map((s) => s.questionResults) ?? []),
  ].filter((list): list is StoredResult[] => Array.isArray(list))
  if (lists.every((list) => list.every((r) => r.question))) return record

  let bank: Map<string, Question> | undefined
  const fromBank = (id: string): Question | undefined => {
    bank ??= new Map(
      (subjects[record.subject.id]?.questions ?? []).map((q) => [q.id, q]),
    )
    console.warn(
      `[historyStore] 找不到快照，改用目前題庫 ${record.subject.id}/${id}`,
    )
    return bank.get(id)
  }
  const fill = (list: StoredResult[]): DetailedQuestionResult[] =>
    list.flatMap(({ snapshot, ...r }) => {
      const question =
        r.question ??
        (snapshot ? snapshots[snapshot] : undefined) ??
        fromBank(r.questionId)
      if (!question) {
        console.warn(
          `[historyStore] 題庫找不到題目 ${record.subject.id}/${r.questionId}，略過顯示`,
        )
        return []
      }
      return [{ ...r, question }]
    })

  return {
    ...record,
    results: {
      ...record.results,
      questionResults:
        results?.questionResults && fill(results.questionResults),
      stageResults: record.results.stageResults?.map((stage, i) => ({
        ...stage,
        questionResults: fill(results!.stageResults![i].questionResults),
      })),
    },
  }
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
  raw = [...raw, slim(record)]
  // 先寫快照：記錄寫入失敗只會多出沒被引用的快照，反過來則會缺快照
  write(STORAGE_KEYS.QUESTION_SNAPSHOTS, snapshots)
  write(STORAGE_KEYS.QUIZ_HISTORY, raw)
  emit()
}

/** 清空全部記錄與快照並持久化、通知所有訂閱者。 */
export function clearHistory(): void {
  cache = []
  raw = []
  snapshots = {}
  write(STORAGE_KEYS.QUESTION_SNAPSHOTS, snapshots)
  write(STORAGE_KEYS.QUIZ_HISTORY, raw)
  emit()
}

/**
 * React hook：訂閱歷史記錄，內容變動時自動重渲染。
 * 回傳的陣列為唯讀快照，請勿直接 mutate（需要排序/反轉時先複製）。
 */
export function useHistoryStore(): HistoryRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
