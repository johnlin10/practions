/**
 * Practions 專案核心型別定義
 * 集中管理所有資料結構的型別
 */

import { Question, QuestionTypeId } from './questions'
import { AnswersCollection, QuizState as QuizStateFromAnswers } from './answers'
import { SubjectConfig, FlowMode } from './quiz-flows'

// 基礎型別
type QuizType = 'once_choice' | 'multiple_choice' | 'true_false' | 'vocabulary'

// 科目介面
interface Subject {
  id: string
  name: string
  quizType: QuizType
  quizOpen: boolean
  questionCount: number
  timeLimit: number
  lockTime?: string[]
  questions: Question[]
}

// 重新導出 QuizState（從 answers.ts）
export type QuizState = QuizStateFromAnswers

// 詳細的題目結果介面
export interface DetailedQuestionResult {
  questionId: string
  question: Question
  userAnswer: string | number | number[] | boolean | undefined
  correctAnswer: string | number | number[] | boolean
  isCorrect: boolean
  isUnanswered: boolean
  stageId?: string // 適用於多階段測驗
}

// 階段結果介面（用於多階段測驗）
export interface DetailedStageResult {
  stageId: string
  mode: string // QuizModeId
  correctCount: number
  totalCount: number
  correctRate: string
  questionResults: DetailedQuestionResult[]
  // 該階段及格門檻（沿用 QuizStageConfig.passingScore；無則 undefined）
  passingScore?: number
  // 該階段是否通過（correctCount >= passingScore）；無門檻時為 undefined
  passed?: boolean
  // 顯示用名稱
  label?: string
}

// 完整的評分報告介面
export interface DetailedQuizResults {
  // 整體結果
  totalCorrect: number
  totalQuestions: number
  overallCorrectRate: string

  // 多階段結果（適用於 PVQC）
  stageResults?: DetailedStageResult[]

  // 單階段結果（適用於 Standard，為了向後相容）
  questionResults?: DetailedQuestionResult[]

  // 整體是否通過（僅 pvqc_official 模式有意義：所有階段皆 passed 才為 true）
  overallPassed?: boolean

  // 向後兼容屬性
  correctRate?: string
  correctCount?: number
  wrongQuestions?: Question[]
}

// 測驗類型區分
export type QuizRecordType = 'standard' | 'pvqc'

// 歷史記錄介面
export interface HistoryRecord {
  // 唯一標識符
  id: string

  // 基本資訊
  subject: {
    id: string
    name: string
    baseQuestionType: QuestionTypeId
  }

  // 測驗類型
  recordType: QuizRecordType

  // 流程模式（舊紀錄無此欄位，讀取時依 recordType / stages 數量 fallback）
  flowMode?: FlowMode

  // 流程資訊（適用於 PVQC）
  flowConfig?: {
    id: string
    name: string
    stages: Array<{
      stageId: string
      mode: string
      questionCount: number
      passingScore?: number
      label?: string
    }>
  }

  // 時間資訊
  date: Date
  duration: number

  // 完整的評分報告
  results: DetailedQuizResults

  // 向後兼容（舊版本資料）
  correctRate?: string
  correctCount?: number
  answers?: AnswersCollection
  questions?: Question[]
}

// 階段結果介面
export interface StageResults {
  stageId: string
  mode: string // QuizModeId
  correctCount: number
  totalCount: number
  correctRate: string
  wrongQuestions: Question[]
}

// 測驗結果介面（支援多階段）
export interface QuizResults {
  // 整體結果
  totalCorrect: number
  totalQuestions: number
  overallCorrectRate: string

  // 各階段結果
  stageResults: StageResults[]

  // 向後兼容（單階段時使用）
  correctRate?: string
  correctCount?: number
  wrongQuestions?: Question[]
}

//* 元件 Props 介面
export interface QuizContextType {
  quizState: QuizState

  // 開始測驗
  startQuiz: (subjectConfig: SubjectConfig) => void

  // 提交答案
  submitAnswer: (
    questionId: string,
    answer: string | number | number[] | boolean
  ) => void

  // 完成當前階段
  finishStage: () => boolean // 返回是否還有下一階段

  // 完成整個測驗，返回歷史記錄 ID
  finishQuiz: () => string | null

  // 導航
  handlePrev: () => void
  handleNext: (targetIndex?: number) => void

  // 多階段相關
  goToStage: (stageIndex: number) => void
  hasNextStage: () => boolean
}

// React 相關型別
export interface BaseComponentProps {
  children?: React.ReactNode
}

export type QuizProviderProps = BaseComponentProps

// 路由參數型別
export interface HistoryParams {
  id: string
}

export interface BankParams {
  subjectId: string
}

// 工具函數型別
export type CalculateResultsFunction = (
  questions: Question[],
  answers: AnswersCollection
) => QuizResults

export type IsSubjectLockedFunction = (subject: Subject) => boolean

// 本地存儲鍵值
export const STORAGE_KEYS = {
  QUIZ_HISTORY: 'quizHistory-v3',
} as const

// 重新導出設定相關型別
export type { AppSettings, PVQCSettings, UseSettingsReturn } from './settings'
export { DEFAULT_SETTINGS } from './settings'

// 重新導出流程相關型別
export type { FlowMode, QuizFlowConfig, QuizStageConfig, SubjectConfig } from './quiz-flows'

// 錯誤型別
export class PractionsError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'PractionsError'
  }
}
