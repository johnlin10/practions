/**
 * [function] answerKey
 * 產生 answers 字典的 compound key：`stageId:questionId`
 *
 * Why: PVQC 跨階段允許重複題目（同題庫獨立洗牌），
 * 若只用 questionId 當 key，上一階段的答案會污染下一階段。
 */
export function answerKey(stageId: string, questionId: string): string {
  return `${stageId}::${questionId}`
}
