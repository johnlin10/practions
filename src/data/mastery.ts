/**
 * 掌握度：每個題庫已掌握的比例
 *
 * 一項 = 題目＋作答方式（PVQC 每個單字有六種作答方式，總數 = 字數 × 6）。
 * 最近連續答對 REMOVE_AFTER 次才算掌握，之後再答錯就掉回來（同時回到錯題）。
 * 總數以目前題庫為準；沒作答過的題庫不列出。
 */
import { useMemo } from 'react'
import type { HistoryRecord } from '@/types'
import type { SubjectConfig } from '@/types/quiz-flows'
import { QUIZ_MODES, type QuizModeId } from '@/types/quiz-modes'
import { useHistoryStore } from '@/data/historyStore'
import { REMOVE_AFTER, answeredInOrder } from '@/data/wrongQuestions'

// PVQC 的六種作答方式，依測驗一到六
const PVQC_MODES = (Object.keys(QUIZ_MODES) as QuizModeId[]).filter(
  (mode) => mode !== 'standard',
)

/** 題庫的作答方式：單字題庫是 PVQC 六種，其他只有標準。 */
export const modesOf = (subject: SubjectConfig): QuizModeId[] =>
  subject.baseQuestionType === 'vocabulary' ? PVQC_MODES : ['standard']

export interface ModeMastery {
  mode: QuizModeId
  mastered: number
  total: number
  // 這種作答方式做過至少一題
  practiced: boolean
}

export interface SubjectMastery {
  mastered: number
  total: number
  modes: ModeMastery[]
}

/**
 * 百分比，無條件捨去：全部掌握才會是 100。
 * 介於 0–1% 或 99–100% 時取到小數一位（0.4%、99.7%），避免一直停在 0% 或 99%；
 * 小數一位還是 0 就顯示 0%。
 */
export function masteryPercent({
  mastered,
  total,
}: SubjectMastery | ModeMastery): number {
  const percent = total ? (mastered / total) * 100 : 0
  if ((percent > 0 && percent < 1) || (percent > 99 && percent < 100))
    return Math.floor(percent * 10) / 10
  return Math.floor(percent)
}

/** 各題庫的掌握度，key 為科目 ID；沒作答過的題庫不在裡面。 */
export function collectMastery(
  history: readonly HistoryRecord[],
): Map<string, SubjectMastery> {
  // `科目/作答方式` → 題號 → 目前連續答對次數
  const streaks = new Map<string, Map<string, number>>()
  const subjects = new Map<string, SubjectConfig>()
  for (const { subject, questionId, mode, isCorrect } of answeredInOrder(
    history,
  )) {
    subjects.set(subject.id, subject)
    const key = `${subject.id}/${mode}`
    let questions = streaks.get(key)
    if (!questions) streaks.set(key, (questions = new Map()))
    questions.set(
      questionId,
      isCorrect ? (questions.get(questionId) ?? 0) + 1 : 0,
    )
  }

  const result = new Map<string, SubjectMastery>()
  for (const subject of subjects.values()) {
    const ids = subject.questions.map((q) => q.id)
    const modes = modesOf(subject).map((mode): ModeMastery => {
      const questions = streaks.get(`${subject.id}/${mode}`)
      return {
        mode,
        // 題庫已刪除的題目不算
        mastered: ids.filter((id) => (questions?.get(id) ?? 0) >= REMOVE_AFTER)
          .length,
        total: ids.length,
        practiced: !!questions,
      }
    })
    result.set(subject.id, {
      mastered: modes.reduce((sum, m) => sum + m.mastered, 0),
      total: modes.reduce((sum, m) => sum + m.total, 0),
      modes,
    })
  }
  return result
}

/** 目前的掌握度（紀錄變動時自動重新計算）。 */
export function useMastery(): Map<string, SubjectMastery> {
  const history = useHistoryStore()
  return useMemo(() => collectMastery(history), [history])
}
