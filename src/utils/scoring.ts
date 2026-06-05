// types
import { Question } from '../types/questions'
import { AnswerRecord } from '../types/answers'
import { QuizModeId } from '../types/quiz-modes'

// interfaces
export interface ScoringStrategy {
  evaluate: (question: Question, answer: AnswerRecord) => boolean
}

// 英文 / 拼音正規化（去前後空白、轉小寫）
const normalizeEnglish = (s: string): string => s.trim().toLowerCase()

// 中文正規化（僅去前後空白，不轉大小寫）
const normalizeChinese = (s: string): string => s.trim()

/**
 * [function] standardScoringStrategy
 * 標準測驗評分（處理單選、多選、是非題）
 * @param {Question} question - 題目
 * @param {AnswerRecord} answer - 答案
 * @returns {boolean} - 是否正確
 */
export const standardScoringStrategy: ScoringStrategy = {
  evaluate: (question, answer) => {
    switch (question.type) {
      case 'single_choice':
        return (
          typeof answer.answer === 'number' &&
          answer.answer === question.correctIndex
        )

      case 'multiple_choice': {
        // 如果答案不是數組，則返回 false
        if (!Array.isArray(answer.answer)) return false
        // 獲取正確答案索引
        const correctIndexes = question.correctIndexes
        // 返回是否正確
        return (
          answer.answer.length === correctIndexes.length &&
          answer.answer.every((idx: number) => correctIndexes.includes(idx))
        )
      }

      case 'true_false':
        return (
          typeof answer.answer === 'boolean' &&
          answer.answer === question.correctAnswer
        )

      default:
        return false
    }
  },
}

/**
 * [function] pvqcWriteScoringStrategy
 * PVQC 拼寫題評分
 * @param {Question} question - 題目
 * @param {AnswerRecord} answer - 答案
 * @returns {boolean} - 是否正確
 */
export const pvqcWriteScoringStrategy: ScoringStrategy = {
  evaluate: (question, answer) => {
    if (question.type !== 'vocabulary' || typeof answer.answer !== 'string') {
      return false
    }
    return normalizeEnglish(answer.answer) === normalizeEnglish(question.english)
  },
}

/**
 * [function] pvqcChineseScoringStrategy
 * PVQC 看英選中、聽英選中評分
 * @param {Question} question - 題目
 * @param {AnswerRecord} answer - 答案
 * @returns {boolean} - 是否正確
 */
export const pvqcChineseScoringStrategy: ScoringStrategy = {
  evaluate: (question, answer) => {
    if (question.type !== 'vocabulary' || typeof answer.answer !== 'string') {
      return false
    }
    return normalizeChinese(answer.answer) === normalizeChinese(question.chinese)
  },
}

/**
 * [function] pvqcEnglishScoringStrategy
 * PVQC 聽英選英評分
 * @param {Question} question - 題目
 * @param {AnswerRecord} answer - 答案
 * @returns {boolean} - 是否正確
 */
export const pvqcEnglishScoringStrategy: ScoringStrategy = {
  evaluate: (question, answer) => {
    if (question.type !== 'vocabulary' || typeof answer.answer !== 'string') {
      return false
    }
    return normalizeEnglish(answer.answer) === normalizeEnglish(question.english)
  },
}

/**
 * [function] pvqcPronunciationScoringStrategy
 * PVQC 發音題評分
 * @param {Question} question - 題目
 * @param {AnswerRecord} answer - 答案
 * @returns {boolean} - 是否正確
 */
export const pvqcPronunciationScoringStrategy: ScoringStrategy = {
  evaluate: (question, answer) => {
    if (question.type !== 'vocabulary' || typeof answer.answer !== 'string') {
      return false
    }
    return normalizeEnglish(answer.answer) === normalizeEnglish(question.english)
  },
}

/**
 * [function] getScoringStrategy
 * 獲取評分策略
 * @param {QuizModeId} mode - 測驗模式 ID
 * @returns {ScoringStrategy} - 評分策略
 */
export const getScoringStrategy = (mode: QuizModeId): ScoringStrategy => {
  // 根據測驗模式返回評分策略
  switch (mode) {
    case 'pvqc_write':
      return pvqcWriteScoringStrategy
    case 'pvqc_read':
    case 'pvqc_listen_chinese':
      return pvqcChineseScoringStrategy
    case 'pvqc_listen_english':
      return pvqcEnglishScoringStrategy
    case 'pvqc_pronunciation':
    case 'pvqc_read_listen':
      return pvqcPronunciationScoringStrategy
    case 'standard':
      return standardScoringStrategy
    default:
      return standardScoringStrategy
  }
}
