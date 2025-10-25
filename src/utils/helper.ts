// types
import { Question } from '../types/questions'
import { QuizState } from '../types/answers'
import { QuizResults, StageResults } from '../types'

// utils
import { getScoringStrategy } from './scoring'

/**
 * [function] calculateResults
 * 計算測驗結果
 * @param {QuizState} quizState - 測驗狀態
 * @returns {QuizResults} - 測驗結果
 */
export const calculateResults = (quizState: QuizState): QuizResults => {
  // 獲取測驗狀態
  const { flowConfig, allStagesQuestions, answers } = quizState

  // 獲取階段結果
  const stageResults: StageResults[] = flowConfig.stages.map((stage) => {
    // 獲取階段題目
    const questions = allStagesQuestions[stage.stageId]
    // 獲取評分策略
    const strategy = getScoringStrategy(stage.mode)

    // 計算正確答案數量
    let correctCount = 0
    // 計算錯誤答案數量
    const wrongQuestions: Question[] = []

    // 遍歷題目
    questions.forEach((question) => {
      // 獲取答案
      const answer = answers[question.id]
      // 如果答案存在
      if (answer) {
        // 評估答案
        const isCorrect = strategy.evaluate(question, answer)
        // 如果答案正確
        if (isCorrect) {
          correctCount++
        } else {
          // 如果答案錯誤
          wrongQuestions.push(question)
        }
      } else {
        // 如果答案不存在
        wrongQuestions.push(question)
      }
    })

    // 返回階段結果
    return {
      stageId: stage.stageId, // 階段 ID
      mode: stage.mode as string, // 測驗模式
      correctCount, // 正確答案數量
      totalCount: questions.length, // 總題數
      correctRate: `${((correctCount / questions.length) * 100).toFixed(0)}%`, // 正確率
      wrongQuestions, // 錯誤題目
    }
  })

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

  // 向後兼容：為單階段測驗添加舊格式屬性
  const firstStageResult = stageResults[0]

  return {
    totalCorrect, // 總正確答案數量
    totalQuestions, // 總題數
    overallCorrectRate: `${((totalCorrect / totalQuestions) * 100).toFixed(
      0
    )}%`, // 總正確率
    stageResults, // 階段結果
    // 向後兼容屬性
    correctRate: firstStageResult?.correctRate, // 正確率
    correctCount: firstStageResult?.correctCount, // 正確答案數量
    wrongQuestions: firstStageResult?.wrongQuestions, // 錯誤題目
  }
}

/**
 * [function] shuffleArray
 * 洗牌
 * @param {T[]} array - 陣列
 * @returns {T[]} - 洗牌後的陣列
 */
export const shuffleArray = <T>(array: T[]): T[] => {
  // 洗牌
  const shuffled = [...array]
  // 遍歷陣列
  for (let i = shuffled.length - 1; i > 0; i--) {
    // 獲取隨機索引
    const j = Math.floor(Math.random() * (i + 1))
    // 交換元素
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
