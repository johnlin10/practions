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

// 即時回饋中「再練一次」那一輪的階段 ID 字尾：答案和回饋跟第一輪分開存
const RETRY_SUFFIX = '~retry'

/** 某階段「再練一次」那一輪的階段 ID。 */
export function retryStageId(stageId: string): string {
  return stageId + RETRY_SUFFIX
}

/** 是否為「再練一次」那一輪。 */
export function isRetryStage(stageId: string): boolean {
  return stageId.endsWith(RETRY_SUFFIX)
}

/** 「再練一次」那一輪所屬的原階段 ID（一般階段原樣回傳）。 */
export function baseStageId(stageId: string): string {
  return isRetryStage(stageId) ? stageId.slice(0, -RETRY_SUFFIX.length) : stageId
}
