import type { Question } from '../types/questions'
import type { QuizStageConfig } from '../types/quiz-flows'

/** Fisher–Yates 洗牌（回傳新陣列）。 */
export function shuffle<T>(list: readonly T[]): T[] {
  const result = [...list]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * 依階段設定抽題：有 questionIds 時只從這些題目抽；有出題組成時先照各題型的題數抽，
 * 不足 questionCount 的部分（含某題型題目不夠）從剩下的題目補滿，最後全部打散。
 */
export function pickQuestions(
  questions: readonly Question[],
  stage: Pick<QuizStageConfig, 'questionCount' | 'composition' | 'questionIds'>,
): Question[] {
  const ids = stage.questionIds && new Set(stage.questionIds)
  const pool = shuffle(ids ? questions.filter((q) => ids.has(q.id)) : questions)
  if (!stage.composition) return pool.slice(0, stage.questionCount)

  const picked = new Set<Question>()
  for (const [type, count] of Object.entries(stage.composition)) {
    pool
      .filter((q) => q.type === type)
      .slice(0, count)
      .forEach((q) => picked.add(q))
  }
  for (const q of pool) {
    if (picked.size >= stage.questionCount) break
    picked.add(q)
  }
  return shuffle([...picked]).slice(0, stage.questionCount)
}
