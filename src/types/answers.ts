import { Question, QuestionTypeId } from './questions'
import { QuizFlowConfig, QuizStageConfig } from './quiz-flows'

// 前置宣告 DetailedQuizResults，避免循環引用（真正的型別定義在 ./index.ts）
interface DetailedQuizResultsLite {
  totalCorrect: number
  totalQuestions: number
  overallCorrectRate: string
  stageResults?: any[]
  questionResults?: any[]
  overallPassed?: boolean
  correctRate?: string
  correctCount?: number
  wrongQuestions?: Question[]
}

// 答案紀錄格式
export interface AnswerRecord {
  questionId: string
  questionIndex: number
  // 答案內容
  answer: string | number | number[] | boolean
  timestamp: Date
  // 階段資訊（多階段測驗用）
  stageId?: string
}

// 答案集合
export type AnswersCollection = Record<string, AnswerRecord>

// 測驗狀態
export interface QuizState {
  // 科目資訊
  subjectId: string
  subjectName: string
  baseQuestionType: QuestionTypeId

  // 流程資訊
  flowConfig: QuizFlowConfig
  currentStageIndex: number
  currentStage: QuizStageConfig

  // 題目與答案
  allStagesQuestions: Record<string, Question[]> // 各階段題目
  currentQuestions: Question[] // 當前階段題目
  answers: AnswersCollection

  // PVQC 選項緩存（確保選項順序穩定）
  pvqcOptionsCache?: Record<string, string[]>

  // 進度
  currentQuestionIndex: number

  // 時間
  startTime: Date | null
  endTime: Date | null
  stageStartTime: Date | null

  // 結果（測驗完成後儲存的詳細評分報告）
  results?: DetailedQuizResultsLite
}
