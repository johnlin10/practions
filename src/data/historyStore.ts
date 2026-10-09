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
 *
 * 雲端模式（登入中）：cloud.ts 透過 attachCloud 接上 Firestore，之後讀寫改走雲端，
 * 記憶體中的 raw / snapshots / cache 結構不變，對外 API 與頁面都不用改。
 * 登入時 syncLocalToCloud 把本機紀錄併入雲端，伺服器確認後才刪除本機存檔。
 * 登入中新增（交卷、匯入）的紀錄也先存本機，伺服器確認後才刪除，任何一步失敗紀錄都還在。
 */
import { useSyncExternalStore } from 'react'
import type { DetailedQuestionResult, HistoryRecord } from '@/types'
import { STORAGE_KEYS } from '@/types'
import { historyRecordSchema } from '@/schemas/history'
import { readRaw, remove, write } from '@/utils/storage'
import { currentQuestionId, findSubject } from '@/data/subjects'
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

/** 讀取 localStorage 的原始記錄與快照（不驗證）。 */
function readLocal(): {
  history: unknown[]
  snapshots: Record<string, Question>
} {
  const storedSnapshots = readJson(STORAGE_KEYS.QUESTION_SNAPSHOTS)
  const parsed = readJson(STORAGE_KEYS.QUIZ_HISTORY)
  if (parsed !== undefined && !Array.isArray(parsed)) {
    console.warn('[historyStore] 歷史記錄非陣列，視為空紀錄')
  }
  return {
    history: Array.isArray(parsed) ? parsed : [],
    snapshots:
      storedSnapshots && typeof storedSnapshots === 'object'
        ? (storedSnapshots as Record<string, Question>)
        : {},
  }
}

/** 從 localStorage 載入並逐筆驗證。壞掉的記錄略過。 */
function load(): HistoryRecord[] {
  const local = readLocal()
  snapshots = local.snapshots
  return parse(local.history)
}

/**
 * 逐筆驗證並補題，同時把原始物件存進 raw。壞掉的記錄略過。
 */
function parse(items: unknown[]): HistoryRecord[] {
  raw = []
  const valid: HistoryRecord[] = []
  items.forEach((item, index) => {
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
      (findSubject(record.subject.id)?.questions ?? []).map((q) => [q.id, q]),
    )
    console.warn(
      `[historyStore] 找不到快照，改用目前題庫 ${record.subject.id}/${id}`,
    )
    return bank.get(currentQuestionId(record.subject.id, id))
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
  const item = slim(record)
  raw = [...raw, item]
  if (cloud) {
    saveToCloud([item])
  } else {
    // 先寫快照：記錄寫入失敗只會多出沒被引用的快照，反過來則會缺快照
    write(STORAGE_KEYS.QUESTION_SNAPSHOTS, snapshots)
    write(STORAGE_KEYS.QUIZ_HISTORY, raw)
  }
  emit()
}

/** 清空全部記錄與快照並持久化、通知所有訂閱者。登入中會刪除雲端紀錄。 */
export function clearHistory(): void {
  const ids = raw.map(idOf).filter((id): id is string => !!id)
  cache = []
  raw = []
  snapshots = {}
  if (cloud) {
    cloud.remove(ids).catch((error) => {
      console.error('[historyStore] 雲端刪除失敗：', error)
    })
    // 還沒確認上傳的本機備份也一併清除，避免下次登入又同步回來
    dropLocal(ids)
  } else {
    write(STORAGE_KEYS.QUESTION_SNAPSHOTS, snapshots)
    write(STORAGE_KEYS.QUIZ_HISTORY, raw)
  }
  emit()
}

const BACKUP_APP = 'practions'
const BACKUP_VERSION = 1

/** 匯出備份：原始記錄與快照原樣輸出，匯入後位元組不變。登入中匯出雲端紀錄。 */
export function exportHistory(): string {
  getSnapshot()
  return JSON.stringify({
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    history: raw,
    snapshots,
  })
}

function idOf(item: unknown): unknown {
  return (item as { id?: unknown })?.id
}

/**
 * 依 id 合併記錄：已存在或無效的略過，不覆蓋現有記錄。
 * 未登入寫入 localStorage；登入中只更新畫面，回傳的 added 由呼叫端寫入雲端。
 */
function merge(
  history: unknown[],
  incomingSnapshots: unknown,
): { count: number; added: unknown[] } {
  const before = getSnapshot().length
  const ids = new Set(raw.map(idOf))
  const added: unknown[] = []
  for (const item of history) {
    const result = historyRecordSchema.safeParse(item)
    if (!result.success || ids.has(result.data.id)) continue
    ids.add(result.data.id)
    added.push(item)
  }
  if (incomingSnapshots && typeof incomingSnapshots === 'object') {
    // 快照鍵含內容雜湊，同鍵即同內容，合併不會互相覆蓋
    for (const [key, question] of Object.entries(incomingSnapshots)) {
      snapshots[key] ??= question as Question
    }
  }

  if (cloud) {
    cache = parse([...raw, ...added])
  } else {
    write(STORAGE_KEYS.QUESTION_SNAPSHOTS, snapshots)
    write(STORAGE_KEYS.QUIZ_HISTORY, [...raw, ...added])
    // 從 localStorage 重新載入：寫入失敗（例如容量不足）時畫面與筆數仍反映實際狀態
    cache = load()
  }
  emit()
  return { count: cache.length - before, added }
}

/**
 * 匯入備份：依 id 合併，已存在或無效的記錄略過，不會覆蓋現有記錄。
 * 回傳實際新增的筆數；檔案格式不符時丟出帶訊息的 Error。
 */
export function importHistory(text: string): number {
  let data: {
    app?: unknown
    version?: unknown
    history?: unknown
    snapshots?: unknown
  }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('檔案不是有效的 JSON')
  }
  if (data?.app !== BACKUP_APP || !Array.isArray(data.history)) {
    throw new Error('這不是 Practions 的測驗紀錄備份檔')
  }
  if (typeof data.version !== 'number' || data.version > BACKUP_VERSION) {
    throw new Error('備份檔版本較新，請先更新 Practions')
  }
  const { count, added } = merge(data.history, data.snapshots)
  saveToCloud(added)
  return count
}

/* ------------------------------ 雲端模式 ------------------------------ */

/** 雲端的一筆紀錄：data 為原始記錄與其引用快照的 JSON，原樣保存避開 Firestore 的型別限制。 */
export interface CloudEntry {
  id: string
  date: string
  data: string
}

/** 雲端寫入端（由 cloud.ts 提供），Promise 在伺服器確認後完成。 */
export interface CloudSink {
  save: (entries: CloudEntry[]) => Promise<void>
  remove: (ids: string[]) => Promise<void>
}

let cloud: CloudSink | null = null
// 登入過的瀏覽器在雲端資料到達前視為載入中，避免先閃出「沒有紀錄」
let ready = !readRaw(STORAGE_KEYS.SIGNED_IN)

// Firestore 單次寫入上限 500 筆、10 MiB：每批最多 100 筆、約 4 MiB
const BATCH_COUNT = 100
const BATCH_BYTES = 4 * 1024 * 1024

/** 這筆原始記錄引用到的快照。 */
function usedSnapshots(item: unknown): Record<string, Question> {
  const record = item as {
    results?: {
      questionResults?: StoredResult[]
      stageResults?: { questionResults?: StoredResult[] }[]
    }
  }
  const used: Record<string, Question> = {}
  const lists = [
    record.results?.questionResults,
    ...(record.results?.stageResults?.map((s) => s.questionResults) ?? []),
  ]
  for (const list of lists) {
    for (const r of list ?? []) {
      if (r.snapshot && snapshots[r.snapshot])
        used[r.snapshot] = snapshots[r.snapshot]
    }
  }
  return used
}

/** 原始記錄打包成雲端格式：只帶這筆記錄引用到的快照，文件自給自足。 */
function toCloudEntry(item: unknown): CloudEntry {
  const record = item as { id: string; date: string | Date }
  return {
    id: record.id,
    date: new Date(record.date).toISOString(),
    data: JSON.stringify({ record: item, snapshots: usedSnapshots(item) }),
  }
}

/**
 * 依筆數與大小分批寫入雲端。所有批次同時送出：離線時全部排進 Firestore 的佇列，
 * 不會卡在第一批等確認。Promise 在全部批次都被伺服器確認後完成。
 */
function saveEntries(sink: CloudSink, items: unknown[]): Promise<void> {
  const batches: CloudEntry[][] = []
  let bytes = 0
  for (const entry of items.map(toCloudEntry)) {
    // UTF-16 長度 ×3 為 UTF-8 位元組數的上限
    const size = entry.data.length * 3
    const last = batches[batches.length - 1]
    if (last && last.length < BATCH_COUNT && bytes + size <= BATCH_BYTES) {
      last.push(entry)
      bytes += size
    } else {
      batches.push([entry])
      bytes = size
    }
  }
  return Promise.all(batches.map((batch) => sink.save(batch))).then(() => {})
}

/** 記錄加進 localStorage（含引用的快照）。 */
function appendLocal(items: unknown[]): void {
  const local = readLocal()
  write(STORAGE_KEYS.QUESTION_SNAPSHOTS, {
    ...local.snapshots,
    ...Object.assign({}, ...items.map(usedSnapshots)),
  })
  write(STORAGE_KEYS.QUIZ_HISTORY, [...local.history, ...items])
}

/** 從 localStorage 移除指定 id 的記錄；沒有剩下的記錄時連快照一起清除。 */
function dropLocal(ids: unknown[]): void {
  const drop = new Set(ids)
  const rest = readLocal().history.filter((item) => !drop.has(idOf(item)))
  if (rest.length > 0) {
    write(STORAGE_KEYS.QUIZ_HISTORY, rest)
  } else {
    remove(STORAGE_KEYS.QUIZ_HISTORY)
    remove(STORAGE_KEYS.QUESTION_SNAPSHOTS)
  }
}

/**
 * 登入中寫入雲端：先在本機存一份，伺服器確認後才刪除。
 * 離線時關閉 App、雲端拒絕寫入，紀錄都還在本機，下次登入時同步。
 */
function saveToCloud(items: unknown[]): void {
  if (!cloud || items.length === 0) return
  appendLocal(items)
  saveEntries(cloud, items)
    .then(() => dropLocal(items.map(idOf)))
    .catch((error) => {
      console.error('[historyStore] 雲端寫入失敗，紀錄保留在本機：', error)
    })
}

/** 登入：改用雲端，清空畫面等雲端資料到達。 */
export function attachCloud(sink: CloudSink): void {
  cloud = sink
  ready = false
  raw = []
  snapshots = {}
  cache = []
  emit()
}

/** 收到雲端的全部紀錄（依日期排序）。 */
export function receiveCloud(entries: string[]): void {
  const items: unknown[] = []
  snapshots = {}
  for (const data of entries) {
    try {
      const parsed = JSON.parse(data) as {
        record: unknown
        snapshots?: Record<string, Question>
      }
      Object.assign(snapshots, parsed.snapshots)
      items.push(parsed.record)
    } catch (error) {
      console.warn('[historyStore] 略過無法解析的雲端紀錄：', error)
    }
  }
  cache = parse(items)
  ready = true
  emit()
}

/** 登出或確認未登入：回到 localStorage。 */
export function detachCloud(): void {
  cloud = null
  ready = true
  cache = null
  emit()
}

/**
 * 把這個瀏覽器的本機紀錄合併進雲端，伺服器確認後刪除本機存檔。
 * 回傳新增到雲端的筆數。寫入失敗時保留本機存檔，下次登入再試。
 */
export async function syncLocalToCloud(): Promise<number> {
  const local = readLocal()
  if (!cloud || local.history.length === 0) return 0
  const { count, added } = merge(local.history, local.snapshots)
  await saveEntries(cloud, added)
  // 只刪除這次同步的記錄：等待確認期間新交卷的記錄有自己的本機備份
  // ponytail: 驗證不過的本機紀錄（本來就不會顯示）不上傳，一併刪除
  dropLocal(local.history.map(idOf))
  return count
}

function getReady(): boolean {
  return ready
}

/** React hook：雲端紀錄是否已載入（未登入時永遠為 true）。 */
export function useHistoryReady(): boolean {
  return useSyncExternalStore(subscribe, getReady)
}

/**
 * React hook：訂閱歷史記錄，內容變動時自動重渲染。
 * 回傳的陣列為唯讀快照，請勿直接 mutate（需要排序/反轉時先複製）。
 */
export function useHistoryStore(): HistoryRecord[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
