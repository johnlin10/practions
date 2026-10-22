/**
 * 錯題複習：從測驗紀錄計算每個科目還有哪些錯題
 *
 * 一道錯題 = 科目＋題目＋作答方式（PVQC 在「寫」錯、在「讀」對，算兩題）。
 * 依時間順序走過所有紀錄（含複習紀錄）：答錯就列入並重新計算，
 * 在 REMOVE_AFTER 個不同的日子答對就移出（同一天重複答對只算一次）；沒作答的題目不影響。
 * 已經答對過的錯題，要到隔天、且距離上次答對至少 MIN_GAP_HOURS 小時才再出現確認一次。
 * 移出後依 REVIEW_GAPS 隔越來越久再回顧（到期才出現，畫面上不標示），中途答錯就回到錯題。
 * 舊科目 ID（如合併前的 AIL）會對應到目前的科目與題號，題目內容以目前題庫為準，
 * 題庫已刪除的題目不列出。考試鎖定中的科目不列出，避免考試時查答案。
 */
import { useSyncExternalStore } from 'react'
import type { DetailedQuestionResult, HistoryRecord, RetryResult } from '@/types'
import type { Question } from '@/types/questions'
import { QUESTION_TYPE_LABELS } from '@/types/questions'
import type { QuizFlowConfig, SubjectConfig } from '@/types/quiz-flows'
import { QUIZ_MODES, type QuizModeId } from '@/types/quiz-modes'
import { currentQuestionId, findSubject, subjects } from '@/data/subjects'
import { deriveFromHistory } from '@/data/historyStore'
import { isSubjectLocked } from '@/pages/Bank/utils/bankHelpers'

// 在幾個不同的日子答對後移出（也是掌握度的「已掌握」門檻）
export const REMOVE_AFTER = 2

// 移出錯題後，每次回顧要隔幾天（從上次答對那天算）；到期後答對才進下一次，全部通過就不再安排
export const REVIEW_GAPS = [3, 7, 14]

// 兩次答對至少要隔幾小時才算不同次（避免 23:59 答對、0:00 又馬上出現）
export const MIN_GAP_HOURS = 8

/** 答錯後答對的次數，同一天只算一次。 */
export interface Streak {
  count: number
  // 最近一次計入的日期（dayOf，例如 2026-10-11）；歸零時為空字串
  day: string
  // 最近一次計入的時間（毫秒）；歸零時為 0
  at: number
}

// 凌晨幾點換日：熬夜到半夜答的題還算前一天
export const DAY_STARTS_AT = 3

/** 本地時間的日期，例如 2026-10-11；凌晨 DAY_STARTS_AT 點前算前一天。 */
export const dayOf = (date: Date): string =>
  new Date(date.getTime() - DAY_STARTS_AT * 60 * 60 * 1000).toLocaleDateString('sv')

/** 跟上次計入的答對隔天，且至少隔 MIN_GAP_HOURS 小時。歸零的 streak 一律成立。 */
export const isNextSession = (prev: Streak, date: Date): boolean =>
  dayOf(date) !== prev.day &&
  date.getTime() - prev.at >= MIN_GAP_HOURS * 60 * 60 * 1000

/** 下一次回顧的日期；還沒移出錯題或已經全部回顧完時為 undefined。 */
export function dueDay({ count, day }: Streak): string | undefined {
  const gap = REVIEW_GAPS[count - REMOVE_AFTER]
  if (gap === undefined) return undefined
  // 中午算，避開日光節約時間切換的那一小時
  const date = new Date(`${day}T12:00`)
  date.setDate(date.getDate() + gap)
  return dayOf(date)
}

/**
 * 同一天內、或間隔不到 MIN_GAP_HOURS 小時重複答對只算一次，隔天且隔夠久再答對才累積，答錯歸零（successive relearning：
 * 隔天還答得出來，比同一次練習中多答對幾次更能代表記住了）。錯題與掌握度共用。
 * 移出錯題後，要等到下一次回顧到期才算，太早答對不累積，也不歸零。
 */
export function nextStreak(
  prev: Streak | undefined,
  isCorrect: boolean,
  date: Date,
): Streak {
  if (!isCorrect) return { count: 0, day: '', at: 0 }
  if (prev && !isNextSession(prev, date)) return prev
  const day = dayOf(date)
  if (prev && prev.count >= REMOVE_AFTER) {
    const due = dueDay(prev)
    if (!due || day < due) return prev
  }
  return { count: (prev?.count ?? 0) + 1, day, at: date.getTime() }
}

export interface WrongItem {
  question: Question
  mode: QuizModeId
  wrongCount: number
  lastWrong: Date
  streak: Streak
}

export interface WrongSubject {
  subject: SubjectConfig
  // 錯最多次的在前，同樣次數時最近答錯的在前
  items: WrongItem[]
}

interface Tracker {
  subjectId: string
  questionId: string
  mode: QuizModeId
  wrongCount: number
  lastWrong: Date
  streak: Streak
}

// 判斷錯題只需要的作答欄位（「再練一次」的結果沒有題目內容）
type Answered = Pick<
  DetailedQuestionResult,
  'questionId' | 'userAnswer' | 'isCorrect'
> & { isUnanswered?: boolean }

type Section = { mode: QuizModeId; results: Answered[] }

/** 紀錄中每一段的作答方式與逐題結果（PVQC 為各階段，標準測驗為一段）。 */
function sectionsOf(record: HistoryRecord): Section[] {
  const { results } = record
  if (!results) return []
  if (results.stageResults?.length) {
    return results.stageResults.map((stage) => ({
      mode: (stage.mode || 'standard') as QuizModeId,
      results: stage.questionResults ?? [],
    }))
  }
  const mode = (record.flowConfig?.stages?.[0]?.mode || 'standard') as QuizModeId
  return [{ mode, results: results.questionResults ?? [] }]
}

/**
 * 紀錄中「再練一次」的結果（v3.6 起才有）。紀錄來自本機、雲端或匯入的備份，
 * 結構沒有嚴格驗證，格式不對的項目略過。
 */
function retryResultsOf(record: HistoryRecord): RetryResult[] {
  const list: unknown = record.results?.retryResults
  if (!Array.isArray(list)) return []
  return list.filter(
    (result): result is RetryResult =>
      typeof result?.questionId === 'string' &&
      typeof result.mode === 'string' &&
      result.mode in QUIZ_MODES &&
      typeof result.isCorrect === 'boolean',
  )
}

/** 紀錄中的每一段：先第一輪，再接「再練一次」的結果（同一筆紀錄裡，再練的比較晚）。 */
function allSectionsOf(record: HistoryRecord): Section[] {
  const retry = retryResultsOf(record).map((result) => ({
    mode: result.mode as QuizModeId,
    results: [result],
  }))
  return [...sectionsOf(record), ...retry]
}

/** 「再練一次」答對的題目，key 為 `作答方式/題號`。 */
export function retryCorrectKeys(record: HistoryRecord): Set<string> {
  return new Set(
    retryResultsOf(record)
      .filter((result) => result.isCorrect)
      .map((result) => `${result.mode}/${result.questionId}`),
  )
}

/**
 * 錯題複習、隨手練紀錄的結算：一次答對、再練答對、還要加強各幾題。
 * 其他紀錄回傳 null。
 */
export function reviewSummary(
  record: HistoryRecord,
): { first: number; retry: number; remaining: number; total: number } | null {
  if (record.flowMode !== 'review' && record.flowMode !== 'practice')
    return null
  const retried = retryCorrectKeys(record)
  let first = 0
  let retry = 0
  let total = 0
  for (const { mode, results } of sectionsOf(record)) {
    for (const result of results) {
      total++
      if (result.isCorrect) first++
      else if (retried.has(`${mode}/${result.questionId}`)) retry++
    }
  }
  return { first, retry, remaining: total - first - retry, total }
}

export interface AnsweredEvent {
  subject: SubjectConfig
  // 目前題庫的題號（舊科目已換算）
  questionId: string
  mode: QuizModeId
  isCorrect: boolean
  date: Date
}

/**
 * 依時間順序列出所有紀錄（含複習與「再練一次」）的每一筆作答。
 * 沒作答、題庫已不存在的科目略過。錯題與掌握度都從這裡算。
 */
export function* answeredInOrder(
  history: readonly HistoryRecord[],
): Generator<AnsweredEvent> {
  const chronological = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )
  for (const record of chronological) {
    const subject = findSubject(record.subject.id)
    if (!subject) continue
    const date = new Date(record.date)
    for (const { mode, results } of allSectionsOf(record)) {
      for (const result of results) {
        const unanswered =
          result.isUnanswered ||
          result.userAnswer === undefined ||
          result.userAnswer === null
        if (unanswered || !result.questionId) continue
        yield {
          subject,
          questionId: currentQuestionId(record.subject.id, result.questionId),
          mode,
          isCorrect: result.isCorrect,
          date,
        }
      }
    }
  }
}

/**
 * 從測驗紀錄計算各科目的錯題，錯題多的科目在前。
 * 也包含已經移出、之後還要回顧的題目（streak.count >= REMOVE_AFTER），由 dueToday 決定今天出不出現。
 */
export function collectWrongQuestions(
  history: readonly HistoryRecord[],
): WrongSubject[] {
  const trackers = new Map<string, Tracker>()
  for (const { subject, questionId, mode, isCorrect, date } of answeredInOrder(
    history,
  )) {
    const key = `${subject.id}/${questionId}/${mode}`
    const tracker = trackers.get(key)
    if (!isCorrect) {
      trackers.set(key, {
        subjectId: subject.id,
        questionId,
        mode,
        wrongCount: (tracker?.wrongCount ?? 0) + 1,
        lastWrong: date,
        streak: nextStreak(undefined, false, date),
      })
    } else if (tracker) {
      tracker.streak = nextStreak(tracker.streak, true, date)
      // 移出錯題後留著安排回顧，全部回顧完才不再追蹤
      if (tracker.streak.count >= REMOVE_AFTER && !dueDay(tracker.streak))
        trackers.delete(key)
    }
  }

  const groups = new Map<string, WrongSubject>()
  const banks = new Map<string, Map<string, Question>>()
  for (const tracker of trackers.values()) {
    const subject = findSubject(tracker.subjectId)
    if (!subject || isSubjectLocked(subject)) continue
    let bank = banks.get(subject.id)
    if (!bank) {
      bank = new Map(subject.questions.map((q) => [q.id, q]))
      banks.set(subject.id, bank)
    }
    const question = bank.get(tracker.questionId)
    if (!question) continue

    const item: WrongItem = {
      question,
      mode: tracker.mode,
      wrongCount: tracker.wrongCount,
      lastWrong: tracker.lastWrong,
      streak: tracker.streak,
    }
    const group = groups.get(subject.id)
    if (!group) groups.set(subject.id, { subject, items: [item] })
    else group.items.push(item)
  }

  for (const group of groups.values()) {
    group.items.sort(
      (a, b) =>
        b.wrongCount - a.wrongCount ||
        b.lastWrong.getTime() - a.lastWrong.getTime(),
    )
  }
  return [...groups.values()].sort((a, b) => b.items.length - a.items.length)
}

/**
 * 現在可以複習的題目：錯題中答對過的要到隔天且隔 MIN_GAP_HOURS 小時才出現再確認（畫面上不提，
 * 避免一直練到同一題）；已經移出的只在回顧到期時出現。今天沒題可練的科目不列出。
 */
export function dueToday(
  groups: readonly WrongSubject[],
  now = new Date(),
): WrongSubject[] {
  const today = dayOf(now)
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.streak.count < REMOVE_AFTER
          ? isNextSession(item.streak, now)
          : dueDay(item.streak)! <= today,
      ),
    }))
    .filter((group) => group.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length)
}

// 題型的顯示順序：單選、多選、是非，再來 PVQC 測驗一到六
const KIND_ORDER = [
  ...Object.keys(QUESTION_TYPE_LABELS),
  ...Object.keys(QUIZ_MODES),
]
const kindOf = (item: WrongItem): string =>
  item.mode === 'standard' ? item.question.type : item.mode
const kindOrder = (item: WrongItem) => KIND_ORDER.indexOf(kindOf(item))

/**
 * 依題型輪流取題：每種題型各取一題、再輪下一圈，同一題型內照錯題的優先順序。
 * 避免某個題型錯得特別多次時，每次複習都只抽到那個題型。
 * 題型的輪流順序依各題型最優先那題的排名。
 */
function interleaveByKind(items: readonly WrongItem[]): WrongItem[] {
  const byKind = new Map<string, WrongItem[]>()
  for (const item of items) {
    const list = byKind.get(kindOf(item))
    if (list) list.push(item)
    else byKind.set(kindOf(item), [item])
  }
  const lists = [...byKind.values()]
  const result: WrongItem[] = []
  for (let round = 0; result.length < items.length; round++) {
    for (const list of lists) if (list[round]) result.push(list[round])
  }
  return result
}

/**
 * 複習的優先順序，避免新錯題被錯很多次的老錯題擠掉：
 * 1. 之前某天答對過一次的（再答對就移出，拖久了容易忘），先答對的在前
 * 2. 其餘由新錯題（只錯過 1 次，最近答錯的在前）與老錯題（照原本錯最多次的在前）一題一題交替
 */
function prioritize(items: readonly WrongItem[]): WrongItem[] {
  const confirm = items
    .filter((item) => item.streak.count > 0)
    .sort((a, b) => a.streak.day.localeCompare(b.streak.day))
  const fresh = items
    .filter((item) => item.streak.count === 0 && item.wrongCount === 1)
    .sort((a, b) => b.lastWrong.getTime() - a.lastWrong.getTime())
  const stubborn = items.filter(
    (item) => item.streak.count === 0 && item.wrongCount > 1,
  )
  const mixed: WrongItem[] = []
  for (let i = 0; i < Math.max(fresh.length, stubborn.length); i++) {
    if (fresh[i]) mixed.push(fresh[i])
    if (stubborn[i]) mixed.push(stubborn[i])
  }
  return [...confirm, ...mixed]
}

// 每次複習中，到期回顧題最多佔的比例（錯題不夠時可以補滿）
const REVIEW_SHARE = 1 / 2

/**
 * 這次複習的題目：錯題照優先順序與題型輪流取，到期的回顧題（越早到期的在前）
 * 最多佔 REVIEW_SHARE，讓錯題至少保有一半名額。出題時會再打散，順序不影響作答。
 */
function pickItems(items: readonly WrongItem[], limit: number): WrongItem[] {
  const isReview = (item: WrongItem) => item.streak.count >= REMOVE_AFTER
  const wrong = interleaveByKind(prioritize(items.filter((i) => !isReview(i))))
  const reviews = interleaveByKind(
    items
      .filter(isReview)
      .sort((a, b) => dueDay(a.streak)!.localeCompare(dueDay(b.streak)!)),
  )
  const reviewCount = Math.min(
    reviews.length,
    Math.max(Math.ceil(limit * REVIEW_SHARE), limit - wrong.length),
  )
  return [
    ...wrong.slice(0, limit - reviewCount),
    ...reviews.slice(0, reviewCount),
  ]
}

/** 各題型的錯題數，依題型順序：標準題庫為單選／多選／是非，PVQC 為測驗一：寫等。 */
export function countByKind(items: readonly WrongItem[]): [string, number][] {
  const counts = new Map<string, number>()
  for (const item of [...items].sort((a, b) => kindOrder(a) - kindOrder(b))) {
    const label =
      item.mode === 'standard'
        ? QUESTION_TYPE_LABELS[item.question.type].replace('題', '')
        : QUIZ_MODES[item.mode].name.replace('PVQC ', '')
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts]
}

/**
 * 複習用的測驗流程：依優先順序、題型輪流取 limit 題（含到期的回顧題），不計時，答一題就看到對錯。
 * group 應該只含今天可以複習的錯題（dueToday）。
 * PVQC 依作答方式分成多個階段（紀錄與計分照階段），作答時打散成一條流程。
 */
export function buildReviewFlow(
  group: WrongSubject,
  limit: number,
): QuizFlowConfig {
  const items = pickItems(group.items, limit)
  const modes = [...new Set(items.map((item) => item.mode))].sort(
    (a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b),
  )
  const stages = modes.map((mode) => {
    const questionIds = items
      .filter((item) => item.mode === mode)
      .map((item) => item.question.id)
    const { name, description } = QUIZ_MODES[mode]
    return {
      stageId: modes.length > 1 ? `review-${mode}` : 'main',
      mode,
      questionCount: questionIds.length,
      timeLimit: 0,
      questionIds,
      label:
        mode === 'standard'
          ? undefined
          : `${name.replace('PVQC ', '')}（${description}）`,
    }
  })
  return {
    id: `${group.subject.id}_review`,
    name: group.subject.name,
    type: stages.length > 1 ? 'multi_stage' : 'single_stage',
    stages,
    totalTimeLimit: 0,
    flowMode: 'review',
    instantFeedback: true,
    // PVQC 各作答方式混在一起考，進度是一條完整的流程
    mixStages: stages.length > 1,
  }
}

// 紀錄變動後在空閒時重算，不擋換頁（deriveFromHistory）。
// 鎖定中的題庫不列入錯題，鎖定會隨時間變，所以目前鎖住哪些題庫變了也要重算
const wrongQuestions = deriveFromHistory(collectWrongQuestions, () =>
  Object.values(subjects)
    .filter(isSubjectLocked)
    .map((subject) => subject.id)
    .join(),
)

/** 目前的錯題（紀錄變動時自動重新計算）。 */
export function useWrongQuestions(): WrongSubject[] {
  return useSyncExternalStore(wrongQuestions.subscribe, wrongQuestions.get)
}
