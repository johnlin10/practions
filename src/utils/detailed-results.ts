// types
import { Question } from '../types/questions'
import { QuizState } from '../types/answers'
import {
  DetailedQuestionResult,
  DetailedStageResult,
  DetailedQuizResults,
  QuizRecordType,
} from '../types'
import { QUIZ_MODES } from '../types/quiz-modes'

// utils
import { getScoringStrategy } from './scoring'

/**
 * [function] getCorrectAnswer
 * 獲取題目的正確答案（格式化的字串表示）
 * @param {Question} question - 題目
 * @returns {string | number | number[] | boolean} - 正確答案
 */
function getCorrectAnswer(
  question: Question
): string | number | number[] | boolean {
  switch (question.type) {
    case 'single_choice':
      return question.correctIndex
    case 'multiple_choice':
      return question.correctIndexes
    case 'true_false':
      return question.correctAnswer
    case 'vocabulary':
      return question.english // 對於單字題，正確答案是英文
    default:
      return '未知'
  }
}

/**
 * [function] evaluateAnswer
 * 根據題目類型和測驗模式評估答案是否正確
 * @param {Question} question - 題目
 * @param {string | number | number[] | boolean | undefined} userAnswer - 使用者答案
 * @param {string} mode - 測驗模式
 * @returns {boolean} - 是否正確
 */
function evaluateAnswer(
  question: Question,
  userAnswer: string | number | number[] | boolean | undefined,
  mode: string
): boolean {
  // 如果使用者答案不存在，則返回 false
  if (userAnswer === undefined || userAnswer === null) {
    return false
  }

  // 獲取評分策略
  const strategy = getScoringStrategy(mode as any)
  // 評估答案
  return strategy.evaluate(question, { answer: userAnswer } as any)
}

/**
 * [function] generateQuestionResult
 * 生成單一題目的詳細結果
 * @param {Question} question - 題目
 * @param {string | number | number[] | boolean | undefined} userAnswer - 使用者答案
 * @param {string} stageId - 階段 ID
 * @param {string} mode - 測驗模式
 * @returns {DetailedQuestionResult} - 單一題目的詳細結果
 */
function generateQuestionResult(
  question: Question,
  userAnswer: string | number | number[] | boolean | undefined,
  stageId?: string,
  mode?: string
): DetailedQuestionResult {
  // 獲取正確答案
  const correctAnswer = getCorrectAnswer(question)
  // 評估答案
  const isCorrect = mode ? evaluateAnswer(question, userAnswer, mode) : false
  // 是否未回答
  const isUnanswered = userAnswer === undefined || userAnswer === null

  // 返回單一題目的詳細結果
  return {
    questionId: question.id,
    question,
    userAnswer,
    correctAnswer,
    isCorrect,
    isUnanswered,
    stageId,
  }
}

/**
 * [function] generateStageResult
 * 生成階段的詳細結果
 * @param {string} stageId - 階段 ID
 * @param {string} mode - 測驗模式
 * @param {Question[]} questions - 題目列表
 * @param {Record<string, any>} answers - 答案集合
 * @returns {DetailedStageResult} - 階段的詳細結果
 */
function generateStageResult(
  stageId: string,
  mode: string,
  questions: Question[],
  answers: Record<string, any>
): DetailedStageResult {
  // 生成單一題目的詳細結果
  const questionResults: DetailedQuestionResult[] = questions.map(
    (question) => {
      // 獲取答案記錄
      const answerRecord = answers[question.id]
      // 獲取使用者答案
      const userAnswer = answerRecord?.answer
      // 生成單一題目的詳細結果
      return generateQuestionResult(question, userAnswer, stageId, mode)
    }
  )

  // 計算正確答案數量
  const correctCount = questionResults.filter((q) => q.isCorrect).length
  // 計算總題數
  const totalCount = questions.length
  // 計算正確率
  const correctRate = `${((correctCount / totalCount) * 100).toFixed(0)}%`

  // 返回階段的詳細結果
  return {
    stageId,
    mode,
    correctCount,
    totalCount,
    correctRate,
    questionResults,
  }
}

/**
 * [function] generateDetailedResults
 * 生成完整的詳細評分報告
 * @param {QuizState} quizState - 測驗狀態
 * @returns {DetailedQuizResults} - 完整的詳細評分報告
 */
export function generateDetailedResults(
  quizState: QuizState
): DetailedQuizResults {
  // 獲取測驗狀態
  const { flowConfig, allStagesQuestions, answers } = quizState

  // 檢查是否為 PVQC 測驗（任何階段的模式以 'pvqc' 開頭）
  const isPVQC = flowConfig.stages.some((stage) =>
    stage.mode.startsWith('pvqc')
  )

  // 如果為 PVQC 測驗
  if (isPVQC) {
    // 生成階段的詳細結果
    const stageResults: DetailedStageResult[] = flowConfig.stages.map(
      (stage) => {
        // 獲取階段題目
        const questions = allStagesQuestions[stage.stageId] || []
        // 生成階段的詳細結果
        return generateStageResult(
          stage.stageId,
          stage.mode,
          questions,
          answers
        )
      }
    )

    // 計算總正確答案數量
    const totalCorrect = stageResults.reduce(
      (sum, stage) => sum + stage.correctCount,
      0
    )
    // 計算總題數
    const totalQuestions = stageResults.reduce(
      (sum, stage) => sum + stage.totalCount,
      0
    )
    // 計算總正確率
    const overallCorrectRate = `${(
      (totalCorrect / totalQuestions) *
      100
    ).toFixed(0)}%`

    // 返回完整的詳細評分報告
    return {
      totalCorrect, // 總正確答案數量
      totalQuestions, // 總題數
      overallCorrectRate, // 總正確率
      stageResults, // 階段的詳細結果
    }
  } else {
    // 生成單階段的詳細結果
    const questions = Object.values(allStagesQuestions).flat()
    // 生成單一題目的詳細結果
    const questionResults: DetailedQuestionResult[] = questions.map(
      (question) => {
        // 獲取答案記錄
        const answerRecord = answers[question.id]
        // 獲取使用者答案
        const userAnswer = answerRecord?.answer
        // 獲取測驗模式
        const mode = flowConfig.stages[0]?.mode || 'standard'
        // 生成單一題目的詳細結果
        return generateQuestionResult(question, userAnswer, undefined, mode)
      }
    )

    // 計算總正確答案數量
    const totalCorrect = questionResults.filter((q) => q.isCorrect).length
    // 計算總題數
    const totalQuestions = questions.length
    // 計算總正確率
    const overallCorrectRate = `${(
      (totalCorrect / totalQuestions) *
      100
    ).toFixed(0)}%`

    // 返回完整的詳細評分報告
    return {
      totalCorrect, // 總正確答案數量
      totalQuestions, // 總題數
      overallCorrectRate, // 總正確率
      questionResults, // 單一題目的詳細結果
    }
  }
}

/**
 * [function] determineQuizRecordType
 * 判斷測驗記錄類型
 * @param {any} flowConfig - 流程配置
 * @returns {QuizRecordType} - 測驗記錄類型
 */
export function determineQuizRecordType(flowConfig: any): QuizRecordType {
  // 檢查是否有任何階段的模式是以 'pvqc' 開頭
  const hasPVQCStages = flowConfig.stages.some(
    (stage: any) => stage.mode && stage.mode.startsWith('pvqc')
  )

  // 返回測驗記錄類型
  return hasPVQCStages ? 'pvqc' : 'standard'
}

/**
 * [function] generateFlowConfigSummary
 * 生成歷史記錄的流程配置摘要（用於 PVQC）
 * @param {any} flowConfig - 流程配置
 * @returns {any} - 流程配置摘要
 */
export function generateFlowConfigSummary(flowConfig: any) {
  // 如果流程配置不存在或階段數量為 0，則返回 undefined
  if (!flowConfig || flowConfig.stages.length <= 0) {
    return undefined
  }

  // 返回流程配置摘要
  return {
    id: flowConfig.id,
    name: flowConfig.name,
    stages: flowConfig.stages.map((stage: any) => ({
      stageId: stage.stageId,
      mode: stage.mode,
      questionCount: stage.questionCount,
    })),
  }
}

/**
 * [function] getStageDisplayName
 * 獲取階段的顯示名稱
 * @param {string} mode - 測驗模式
 * @param {number} stageIndex - 階段索引
 * @returns {string} - 階段的顯示名稱
 */
export function getStageDisplayName(mode: string, stageIndex?: number): string {
  // 獲取測驗模式配置
  const modeConfig = QUIZ_MODES[mode as keyof typeof QUIZ_MODES]
  // 如果測驗模式配置存在，則返回測驗模式名稱和描述
  if (modeConfig) {
    return modeConfig.name + '（' + modeConfig.description + '）'
  }

  // 回退到舊的顯示方式
  switch (mode) {
    case 'pvqc_write':
      return 'PVQC 測驗一：寫（看中文，拼寫英文）'
    case 'pvqc_read':
      return 'PVQC 測驗二：讀（看英文，選中文）'
    case 'pvqc_listen_chinese':
      return 'PVQC 測驗三：聽（聽英文，選中文）'
    case 'pvqc_listen_english':
      return 'PVQC 測驗四：聽（聽英文，選英文）'
    case 'pvqc_pronunciation':
      return 'PVQC 測驗五：聽（看中文，選發音）'
    default:
      return `階段 ${stageIndex ? stageIndex + 1 : ''}`
  }
}
