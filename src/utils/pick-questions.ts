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

// 有已掌握的題目時，約這個比例的題數優先從還沒掌握的題目抽，其餘從整個題庫隨機抽
// （已掌握的偶爾也會抽到，忘了才會發現）
const UNMASTERED_SHARE = 0.8

/**
 * 抽題的先後順序：先放約 1 − UNMASTERED_SHARE 的隨機題，再放還沒掌握的，最後是其餘已掌握的。
 * pool 已經打散。
 */
function preferUnmastered(
  pool: readonly Question[],
  mastered: ReadonlySet<string>,
  count: number,
): Question[] {
  const random = pool.slice(0, Math.round(count * (1 - UNMASTERED_SHARE)))
  const rest = pool.slice(random.length)
  return [
    ...random,
    ...rest.filter((q) => !mastered.has(q.id)),
    ...rest.filter((q) => mastered.has(q.id)),
  ]
}

/**
 * 依階段設定抽題：有 questionIds 時只從這些題目抽；有出題組成時先照各題型的題數抽，
 * 不足 questionCount 的部分（含某題型題目不夠）從剩下的題目補滿，最後全部打散。
 * 給了 mastered（已掌握的題號）時，優先抽還沒掌握的題目。
 */
export function pickQuestions(
  questions: readonly Question[],
  stage: Pick<QuizStageConfig, 'questionCount' | 'composition' | 'questionIds'>,
  mastered?: ReadonlySet<string>,
): Question[] {
  const ids = stage.questionIds && new Set(stage.questionIds)
  let pool = shuffle(ids ? questions.filter((q) => ids.has(q.id)) : questions)
  if (mastered?.size)
    pool = preferUnmastered(pool, mastered, stage.questionCount)
  if (!stage.composition) return shuffle(pool.slice(0, stage.questionCount))

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
