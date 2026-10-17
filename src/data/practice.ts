/**
 * 隨手練：從整個題庫出題（同測驗，優先出還沒掌握的），不計時，答一題就看到對錯。
 * 作答一樣算進掌握度與錯題。單字題庫的六種作答方式混在一起出。
 */
import type { HistoryRecord } from '@/types'
import type { QuizFlowConfig, SubjectConfig } from '@/types/quiz-flows'
import { QUIZ_MODES } from '@/types/quiz-modes'
import { findSubject, subjects } from '@/data/subjects'
import { modesOf } from '@/data/mastery'
import { isSubjectLocked } from '@/pages/Bank/utils/bankHelpers'

/** 可以隨手練的題庫：測驗頁的題庫與所有單字題庫，考試鎖定中的不列出。 */
export const practiceSubjects = (): SubjectConfig[] =>
  Object.values(subjects).filter(
    (subject) =>
      (subject.quizOpen || subject.baseQuestionType === 'vocabulary') &&
      !isSubjectLocked(subject),
  )

/**
 * 預設的題庫：最後一次作答（測驗、錯題複習、隨手練）與手動選擇（savedAt 毫秒）中比較新的那一個；
 * 已經不能練的題庫略過，都沒有則為 undefined。
 */
export function defaultPracticeSubject(
  saved: string,
  savedAt: number,
  history: readonly HistoryRecord[],
): SubjectConfig | undefined {
  const available = practiceSubjects()
  const pick = (id?: string) =>
    available.find((subject) => subject.id === (id && findSubject(id)?.id))
  const chosen = pick(saved)
  const latest = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
  for (const record of latest) {
    if (chosen && new Date(record.date).getTime() <= savedAt) return chosen
    const subject = pick(record.subject?.id)
    if (subject) return subject
  }
  return chosen
}

/**
 * 隨手練的流程：count 題平均分給各作答方式（單字題庫是六種，打散成一條流程），
 * 抽題時優先出還沒掌握的（QuizContext）。includeSpelling 為 false 時不出看中拼英。
 */
export function buildPracticeFlow(
  subject: SubjectConfig,
  count: number,
  includeSpelling = true,
): QuizFlowConfig {
  const modes = modesOf(subject).filter(
    (mode) => includeSpelling || mode !== 'pvqc_write',
  )
  const stages = modes.map((mode, i) => {
    const { name, description } = QUIZ_MODES[mode]
    return {
      stageId: modes.length > 1 ? `practice-${mode}` : 'main',
      mode,
      // 除不盡時，前面的作答方式多一題
      questionCount:
        Math.floor(count / modes.length) + (i < count % modes.length ? 1 : 0),
      timeLimit: 0,
      label:
        mode === 'standard'
          ? undefined
          : `${name.replace('PVQC ', '')}（${description}）`,
    }
  })
  return {
    id: `${subject.id}_practice`,
    name: subject.name,
    type: stages.length > 1 ? 'multi_stage' : 'single_stage',
    stages,
    totalTimeLimit: 0,
    flowMode: 'practice',
    instantFeedback: true,
    mixStages: stages.length > 1,
  }
}
