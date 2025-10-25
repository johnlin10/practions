import { VocabularyQuestion } from '../types/questions'
import { QuizModeId } from '../types/quiz-modes'

// PVQC 測驗題目（運行時的資料結構）
export interface PVQCQuizItem {
  originalQuestion: VocabularyQuestion
  mode: QuizModeId
  // 測驗二、三、四需要的選項
  options?: string[]
  correctIndex?: number
}

/**
 * 為 PVQC 測驗二、三、四生成文字選項
 * 從題庫中隨機選擇其他單字作為干擾選項
 * @param targetQuestion - 目標題目
 * @param allQuestions - 題庫
 * @param mode - 測驗模式
 * @param optionCount - 選項數量
 * @returns {Object} - 選項和正確答案索引
 */
export function generatePVQCOptions(
  targetQuestion: VocabularyQuestion,
  allQuestions: VocabularyQuestion[],
  mode: 'pvqc_read' | 'pvqc_listen_chinese' | 'pvqc_listen_english',
  optionCount: number = 4
): { options: string[]; correctIndex: number } {
  // 正確答案
  const correctAnswer =
    // 如果測驗模式為 PVQC 測驗二、三、四
    mode === 'pvqc_read' || mode === 'pvqc_listen_chinese'
      ? targetQuestion.chinese
      : targetQuestion.english

  // 其他題目
  const otherQuestions = allQuestions.filter((q) => q.id !== targetQuestion.id)
  // 干擾選項
  const distractors = otherQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, optionCount - 1)
    .map((q) =>
      mode === 'pvqc_read' || mode === 'pvqc_listen_chinese'
        ? q.chinese
        : q.english
    )

  // 合併並隨機排序
  const options = [...distractors, correctAnswer].sort(
    () => 0.5 - Math.random()
  )
  // 正確答案索引
  const correctIndex = options.indexOf(correctAnswer)

  // 返回選項和正確答案索引
  return { options, correctIndex }
}

/**
 * 為 PVQC 測驗五（發音題）生成英文單字選項
 * 從題庫中隨機選擇其他單字的英文作為干擾選項
 * @param targetQuestion - 目標題目
 * @param allQuestions - 題庫
 * @param optionCount - 選項數量
 * @returns 英文單字選項和正確答案索引
 */
export function generatePVQCPronunciationOptions(
  targetQuestion: VocabularyQuestion,
  allQuestions: VocabularyQuestion[],
  optionCount: number = 4
): { options: string[]; correctIndex: number } {
  // 正確的英文單字
  const correctAnswer = targetQuestion.english

  // 從其他題目中選擇干擾英文單字
  const otherQuestions = allQuestions.filter((q) => q.id !== targetQuestion.id)
  const distractors = otherQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, optionCount - 1)
    .map((q) => q.english)

  // 合併並隨機排序
  const options = [...distractors, correctAnswer].sort(
    () => 0.5 - Math.random()
  )
  // 正確答案索引
  const correctIndex = options.indexOf(correctAnswer)
  // 返回選項和正確答案索引
  return { options, correctIndex }
}

/**
 * 將題目轉換為 PVQC 測驗項目
 * @param question - 題目
 * @param allQuestions - 題庫
 * @param mode - 測驗模式
 * @returns {PVQCQuizItem} - PVQC 測驗項目
 */
export function convertToPVQCQuizItem(
  question: VocabularyQuestion,
  allQuestions: VocabularyQuestion[],
  mode: QuizModeId
): PVQCQuizItem {
  // 文本選項模式
  const textOptionModes = [
    'pvqc_read',
    'pvqc_listen_chinese',
    'pvqc_listen_english',
  ]

  // 如果測驗模式為文本選項模式
  if (textOptionModes.includes(mode)) {
    // 生成文本選項
    const { options, correctIndex } = generatePVQCOptions(
      question,
      allQuestions,
      mode as 'pvqc_read' | 'pvqc_listen_chinese' | 'pvqc_listen_english'
    )

    // 返回 PVQC 測驗項目
    return {
      originalQuestion: question,
      mode,
      options,
      correctIndex,
    }
  }

  // 發音題或其他題型不需要預生成選項
  // 如果測驗模式為發音題或其他題型
  return {
    originalQuestion: question,
    mode,
  }
}
