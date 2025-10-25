import React, { createContext, useContext, useState } from 'react'
import { calculateResults } from '../utils/helper'
import {
  generateDetailedResults,
  determineQuizRecordType,
  generateFlowConfigSummary,
} from '../utils/detailed-results'
import { QuizRecordType, HistoryRecord } from '../types'
import {
  // Subject,
  QuizContextType,
  QuizProviderProps,
  STORAGE_KEYS,
} from '../types'
import { Question } from '../types/questions'
import { QuizState } from '../types/answers'
import {
  QuizFlowConfig,
  QuizStageConfig,
  SubjectConfig,
} from '../types/quiz-flows'
import { QUIZ_MODES } from '../types/quiz-modes'

type AnswerHandler = (
  state: QuizState,
  questionId: string,
  answer: string | number | number[] | boolean
) => QuizState

const QuizContext = createContext<QuizContextType | undefined>(undefined)

/**
 * [component] QuizProvider
 * 測驗上下文提供者
 * @param {React.ReactNode} children - 子元件
 * @returns {JSX.Element} - 測驗上下文提供者
 */
export function QuizProvider({ children }: QuizProviderProps): JSX.Element {
  // 測驗狀態
  const [quizState, setQuizState] = useState<QuizState>({
    subjectId: '',
    subjectName: '',
    baseQuestionType: 'single_choice',
    flowConfig: {} as QuizFlowConfig,
    currentStageIndex: 0,
    currentStage: {} as QuizStageConfig,
    allStagesQuestions: {},
    currentQuestions: [],
    answers: {},
    pvqcOptionsCache: {},
    currentQuestionIndex: 0,
    startTime: null,
    stageStartTime: null,
    endTime: null,
  })

  /**
   * [function] startQuiz
   * 開始測驗
   * @param {SubjectConfig} subjectConfig - 科目配置
   * @returns {void}
   */
  const startQuiz = (subjectConfig: SubjectConfig) => {
    // 取得科目資訊
    const { flowConfig, questions, id, name, baseQuestionType } = subjectConfig

    // 準備所有階段題目
    const allStagesQuestions: Record<string, Question[]> = {}

    // 遍歷所有階段
    flowConfig.stages.forEach((stage) => {
      // 隨機打亂題目
      const shuffled = [...questions]
        .sort(() => 0.5 - Math.random())
        .slice(0, stage.questionCount)

      // 將階段題目存入 allStagesQuestions
      allStagesQuestions[stage.stageId] = shuffled
    })

    // 取得第一階段
    const firstStage = flowConfig.stages[0]

    // 創建新的測驗狀態
    const newState = {
      subjectId: id,
      subjectName: name,
      baseQuestionType,
      flowConfig,
      currentStageIndex: 0,
      currentStage: firstStage,
      allStagesQuestions,
      currentQuestions: allStagesQuestions[firstStage.stageId],
      answers: {},
      currentQuestionIndex: 0,
      startTime: new Date(),
      stageStartTime: new Date(),
      endTime: null,
    }

    // 設定新的測驗狀態
    setQuizState(newState)
  }

  /**
   * [function] hadleSingleChoiceAnswer
   * 單選題答案處理
   * @param {QuizState} state - 測驗狀態
   * @param {string} questionId - 題目 ID
   * @param {number} answer - 使用者答案
   * @returns {QuizState} - 測驗狀態
   */
  const hadleSingleChoiceAnswer: AnswerHandler = (
    state,
    questionId,
    answer
  ) => {
    // 如果答案不是數字，則返回原狀態
    if (typeof answer !== 'number') return state

    // 找到當前題目的索引
    const currentQuestion = state.currentQuestions.findIndex(
      (q) => q.id === questionId
    )

    // 返回新的測驗狀態
    return {
      ...state,
      answers: {
        // 更新答案
        ...state.answers,
        [questionId]: {
          questionId,
          questionIndex: currentQuestion,
          answer,
          timestamp: new Date(),
          stageId: state.currentStage.stageId,
        },
      },
      // 單選題自動跳下一題
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.currentQuestions.length - 1
      ),
    }
  }

  /**
   * [function] handleMultipleChoiceAnswer
   * 多選題答案處理
   * @param {QuizState} state - 測驗狀態
   * @param {string} questionId - 題目 ID
   * @param {number[]} answer - 使用者答案
   * @returns {QuizState} - 測驗狀態
   */
  const handleMultipleChoiceAnswer: AnswerHandler = (
    state,
    questionId,
    answer
  ) => {
    // 如果答案不是數組，則返回原狀態
    if (!Array.isArray(answer)) return state

    // 找到當前題目的索引
    const currentQuestion = state.currentQuestions.findIndex(
      (q) => q.id === questionId
    )

    // 更新使用者答案，並返回新的測驗狀態
    return {
      ...state,
      answers: {
        ...state.answers,
        [questionId]: {
          questionId,
          questionIndex: currentQuestion,
          answer,
          timestamp: new Date(),
          stageId: state.currentStage.stageId,
        },
      },
    }
  }

  /**
   * [function] handleTrueFalseAnswer
   * 是非題答案處理
   * @param {QuizState} state - 測驗狀態
   * @param {string} questionId - 題目 ID
   * @param {boolean} answer - 使用者答案
   * @returns {QuizState} - 測驗狀態
   */
  const handleTrueFalseAnswer: AnswerHandler = (state, questionId, answer) => {
    // 如果答案不是 boolean，則返回原狀態
    if (typeof answer !== 'boolean') return state

    // 找到當前題目的索引
    const currentQuestion = state.currentQuestions.findIndex(
      (q) => q.id === questionId
    )

    // 更新使用者答案，並返回新的測驗狀態
    return {
      ...state,
      answers: {
        ...state.answers,
        [questionId]: {
          questionId,
          questionIndex: currentQuestion,
          answer,
          timestamp: new Date(),
          stageId: state.currentStage.stageId,
        },
      },
      // 是非題自動跳下一題
      currentQuestionIndex: Math.min(
        state.currentQuestionIndex + 1,
        state.currentQuestions.length - 1
      ),
    }
  }

  /**
   * [function] handleTextAnswer
   * 文字題答案處理
   * @param {QuizState} state - 測驗狀態
   * @param {string} questionId - 題目 ID
   * @param {string} answer - 使用者答案
   * @returns {QuizState} - 測驗狀態
   */
  const handleTextAnswer: AnswerHandler = (state, questionId, answer) => {
    // 如果答案不是字串，則返回原狀態
    if (typeof answer !== 'string') return state

    // 找到當前題目的索引
    const currentQuestion = state.currentQuestions.findIndex(
      (q) => q.id === questionId
    )

    // 是否不是 PVQC 發音題或寫題
    const notPvqcPronunciationMode =
      state.currentStage.mode !== 'pvqc_pronunciation'
    // 是否不是 PVQC 寫題
    const notPvqcWriteMode = state.currentStage.mode !== 'pvqc_write'

    // 更新使用者答案，並返回新的測驗狀態
    return {
      ...state,
      answers: {
        ...state.answers,
        [questionId]: {
          questionId,
          questionIndex: currentQuestion,
          answer,
          timestamp: new Date(),
          stageId: state.currentStage.stageId,
        },
      },
      // 如果不是 PVQC 發音題或寫題，則自動跳下一題
      ...(notPvqcPronunciationMode &&
        notPvqcWriteMode && {
          currentQuestionIndex: Math.min(
            state.currentQuestionIndex + 1,
            state.currentQuestions.length - 1
          ),
        }),
    }
  }

  /**
   * [function] submitAnswer
   * 提交答案
   * @param {string} questionId - 題目 ID
   * @param {string | number | number[] | boolean} answer - 使用者答案
   * @returns {void}
   */
  const submitAnswer = (
    questionId: string,
    answer: string | number | number[] | boolean
  ): void => {
    setQuizState((prev) => {
      // 取得當前階段、題目和題目索引
      const { currentStage, currentQuestions, currentQuestionIndex } = prev
      // 取得當前階段模式
      const mode = QUIZ_MODES[currentStage.mode]
      // 取得當前題目
      const currentQuestion = currentQuestions[currentQuestionIndex]

      // 定義答案處理器
      let handler: AnswerHandler

      // 如果是 dynamic 模式（standard），根據題目實際類型選擇答案處理器
      if (mode.answerType === 'dynamic') {
        // 根據題目實際類型選擇答案處理器
        switch (currentQuestion?.type) {
          case 'single_choice':
            handler = hadleSingleChoiceAnswer
            break
          case 'multiple_choice':
            handler = handleMultipleChoiceAnswer
            break
          case 'true_false':
            handler = handleTrueFalseAnswer
            break
          default:
            console.warn('未知的題目類型:', currentQuestion?.type)
            return prev
        }
      } else {
        // 非 dynamic 模式，根據 mode.answerType 選擇答案處理器
        switch (mode.answerType) {
          case 'single_choice':
            handler = hadleSingleChoiceAnswer
            break
          case 'multiple_choice':
            handler = handleMultipleChoiceAnswer
            break
          case 'text':
            handler = handleTextAnswer
            break
          default:
            return prev
        }
      }

      return handler(prev, questionId, answer)
    })
  }

  /**
   * [function] finishQuiz
   * 完成測驗
   * @returns {string | null} - 歷史記錄 ID
   */
  const finishQuiz = (): string | null => {
    // 取得結束時間
    const endTime = new Date()

    // 生成詳細的評分報告
    const detailedResults = generateDetailedResults(quizState)

    // 確保 subject 資料存在，避免儲存 undefined
    if (!quizState.subjectId) {
      return null
    }

    // 判斷測驗記錄類型
    const recordType: QuizRecordType = determineQuizRecordType(
      quizState.flowConfig
    )

    // 生成流程配置摘要（適用於 PVQC）
    const flowConfigSummary = generateFlowConfigSummary(quizState.flowConfig)

    // 生成唯一 ID（YYYYMMDDHHMMSS 格式）
    const generateRecordId = (date: Date): string => {
      // 取得年、月、日、時、分、秒
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')

      // 隨機數用於避免重複（預留）
      // const randomSuffix = Math.random().toString(36).substr(2, 3)

      return `${year}${month}${day}${hours}${minutes}${seconds}`
    }

    // 生成唯一 ID
    const recordId = generateRecordId(endTime)
    // 建立新的歷史記錄格式
    const historyRecord: HistoryRecord = {
      id: recordId,
      subject: {
        id: quizState.subjectId,
        name: quizState.subjectName,
        baseQuestionType: quizState.baseQuestionType,
      },
      recordType,
      flowConfig: flowConfigSummary,
      date: endTime,
      // 計算測驗時間
      duration: quizState.startTime
        ? endTime.getTime() - quizState.startTime.getTime()
        : 0,
      results: detailedResults,
      // 向後兼容的舊格式資料
      correctRate: detailedResults.overallCorrectRate,
      correctCount: detailedResults.totalCorrect,
    }

    // 如果是舊格式（單階段），添加舊的 answers 和 questions 欄位
    if (recordType === 'standard' && detailedResults.questionResults) {
      // 收集所有題目
      const allQuestions: Question[] = []
      // 遍歷所有階段
      Object.values(quizState.allStagesQuestions).forEach((stageQuestions) => {
        allQuestions.push(...stageQuestions)
      })

      // 收集所有答案
      historyRecord.answers = quizState.answers
      // 收集所有題目
      historyRecord.questions = allQuestions
    }

    // 取得 LocalStorage 中的歷史記錄
    const history = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY) || '[]'
    )
    // 添加新的歷史記錄
    history.push(historyRecord)
    // 儲存新的歷史記錄到 LocalStorage 中
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(history))

    // 使用舊的 calculateResults 函數來維持向後兼容（用於 Results 頁面），並返回舊的結果
    const legacyResults = calculateResults(quizState)

    // 設定新的測驗狀態
    setQuizState((prev) => ({
      ...prev,
      endTime,
      results: legacyResults, // 保留舊格式的 results 用於 Results 頁面（即將淘汰）
    }))

    // 返回記錄 ID，用於導航
    return recordId
  }

  /**
   * [function] handlePrev
   * 上一題
   * @returns {void}
   */
  const handlePrev = (): void => {
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex:
        prev.currentQuestionIndex > 0
          ? prev.currentQuestionIndex - 1
          : prev.currentQuestionIndex,
    }))
  }

  /**
   * [function] handleNext
   * 下一題
   * @param {number} targetIndex - 目標索引
   * @returns {void}
   */
  const handleNext = (targetIndex?: number): void => {
    setQuizState((prev) => {
      if (typeof targetIndex === 'number') {
        // 如果提供了目標索引，直接跳轉到該索引（PreviewAllQuestions 使用）
        return {
          ...prev,
          currentQuestionIndex: Math.min(
            Math.max(0, targetIndex),
            prev.currentQuestions.length - 1
          ),
        }
      }

      // 否則按照原邏輯進行下一題
      return {
        ...prev,
        currentQuestionIndex:
          prev.currentQuestionIndex < prev.currentQuestions.length - 1
            ? prev.currentQuestionIndex + 1
            : prev.currentQuestionIndex,
      }
    })
  }

  /**
   * [function] finishStage
   * 完成當前階段
   * @returns {boolean} - 是否還有下一階段
   */
  const finishStage = (): boolean => {
    // 取得下一階段索引
    const nextStageIndex = quizState.currentStageIndex + 1
    // 取得下一階段
    const nextStage = quizState.flowConfig.stages[nextStageIndex]

    // 如果下一階段存在，則設定新的測驗狀態
    if (nextStage) {
      setQuizState((prev) => ({
        ...prev,
        currentStageIndex: nextStageIndex,
        currentStage: nextStage,
        currentQuestions: prev.allStagesQuestions[nextStage.stageId],
        currentQuestionIndex: 0,
        stageStartTime: new Date(),
      }))
      return true // 還有下一階段
    }

    return false // 沒有下一階段
  }

  /**
   * [function] goToStage
   * 跳轉到指定階段
   * @param {number} stageIndex - 階段索引
   * @returns {void}
   */
  const goToStage = (stageIndex: number) => {
    // 取得指定階段
    const stage = quizState.flowConfig.stages[stageIndex]
    // 如果指定階段存在，則設定新的測驗狀態
    if (stage) {
      setQuizState((prev) => ({
        ...prev,
        currentStageIndex: stageIndex,
        currentStage: stage,
        currentQuestions: prev.allStagesQuestions[stage.stageId],
        currentQuestionIndex: 0,
        stageStartTime: new Date(),
      }))
    }
  }

  /**
   * 檢查是否有下一階段
   * @returns {boolean} - 是否還有下一階段
   */
  const hasNextStage = (): boolean => {
    // 如果流程配置不存在或階段不存在，則返回 false
    if (!quizState.flowConfig || !quizState.flowConfig.stages) {
      return false
    }
    return quizState.currentStageIndex < quizState.flowConfig.stages.length - 1
  }

  /**
   * 上下文值
   * @returns {QuizContextType} - 上下文值
   */
  const contextValue: QuizContextType = {
    quizState,
    startQuiz,
    submitAnswer,
    finishStage,
    finishQuiz,
    handlePrev,
    handleNext,
    goToStage,
    hasNextStage,
  }

  // 返回上下文提供者
  return React.createElement(
    QuizContext.Provider,
    { value: contextValue },
    children
  )
}

/**
 * [hook] useQuiz
 * 使用測驗上下文
 * @returns {QuizContextType} - 測驗上下文
 */
export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error('useQuiz 必須在 QuizProvider 內使用')
  }
  return context
}
