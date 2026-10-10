/**
 * 錯題複習：從測驗紀錄計算每個科目還有哪些錯題
 *
 * 一道錯題 = 科目＋題目＋作答方式（PVQC 在「寫」錯、在「讀」對，算兩題）。
 * 依時間順序走過所有紀錄（含複習紀錄）：答錯就列入並重新計算連續答對，
 * 連續答對 REMOVE_AFTER 次就移出；沒作答的題目不影響。
 * 舊科目 ID（如合併前的 AIL）會對應到目前的科目與題號，題目內容以目前題庫為準，
 * 題庫已刪除的題目不列出。考試鎖定中的科目不列出，避免考試時查答案。
 */
import { useMemo } from 'react'
import type { DetailedQuestionResult, HistoryRecord } from '@/types'
import type { Question } from '@/types/questions'
import { QUESTION_TYPE_LABELS } from '@/types/questions'
import type { QuizFlowConfig, SubjectConfig } from '@/types/quiz-flows'
import { QUIZ_MODES, type QuizModeId } from '@/types/quiz-modes'
import { currentQuestionId, findSubject } from '@/data/subjects'
import { useHistoryStore } from '@/data/historyStore'
import { isSubjectLocked } from '@/pages/Bank/utils/bankHelpers'

// 連續答對幾次後移出
const REMOVE_AFTER = 2

export interface WrongItem {
  question: Question
  mode: QuizModeId
  wrongCount: number
  lastWrong: Date
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
  streak: number
}

/** 紀錄中每一段的作答方式與逐題結果（PVQC 為各階段，標準測驗為一段）。 */
function sectionsOf(
  record: HistoryRecord,
): { mode: QuizModeId; results: DetailedQuestionResult[] }[] {
  const { results } = record
  if (!results) return []
  if (results.stageResults?.length) {
    return results.stageResults.map((stage) => ({
      mode: (stage.mode || 'standard') as QuizModeId,
      results: stage.questionResults ?? [],
    }))
  }
  const mode = (record.flowConfig?.stages[0]?.mode || 'standard') as QuizModeId
  return [{ mode, results: results.questionResults ?? [] }]
}

/** 從測驗紀錄計算各科目的錯題，錯題多的科目在前。 */
export function collectWrongQuestions(
  history: readonly HistoryRecord[],
): WrongSubject[] {
  const trackers = new Map<string, Tracker>()
  const chronological = [...history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  for (const record of chronological) {
    const subject = findSubject(record.subject.id)
    if (!subject) continue
    const date = new Date(record.date)
    for (const { mode, results } of sectionsOf(record)) {
      for (const result of results) {
        const unanswered =
          result.isUnanswered ||
          result.userAnswer === undefined ||
          result.userAnswer === null
        if (unanswered || !result.questionId) continue

        const questionId = currentQuestionId(record.subject.id, result.questionId)
        const key = `${subject.id}/${questionId}/${mode}`
        const tracker = trackers.get(key)
        if (!result.isCorrect) {
          trackers.set(key, {
            subjectId: subject.id,
            questionId,
            mode,
            wrongCount: (tracker?.wrongCount ?? 0) + 1,
            lastWrong: date,
            streak: 0,
          })
        } else if (tracker && ++tracker.streak >= REMOVE_AFTER) {
          trackers.delete(key)
        }
      }
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

// 題型的顯示順序：單選、多選、是非，再來 PVQC 測驗一到六
const KIND_ORDER = [...Object.keys(QUESTION_TYPE_LABELS), ...Object.keys(QUIZ_MODES)]
const kindOrder = (item: WrongItem) =>
  KIND_ORDER.indexOf(item.mode === 'standard' ? item.question.type : item.mode)

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
 * 複習用的測驗流程：取錯題清單的前 limit 題，不計時。
 * PVQC 依作答方式分成多個階段，沿用多階段測驗。
 */
export function buildReviewFlow(
  group: WrongSubject,
  limit: number,
): QuizFlowConfig {
  const items = group.items.slice(0, limit)
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
  }
}

/** 目前的錯題（紀錄變動時自動重新計算）。 */
export function useWrongQuestions(): WrongSubject[] {
  const history = useHistoryStore()
  return useMemo(() => collectWrongQuestions(history), [history])
}
