import { Question, QuestionTypeId } from './questions'
import { QuizModeId } from './quiz-modes'

// 測驗流程模式：標準單階段、PVQC 自訂、PVQC 官方模擬
export type FlowMode = 'standard' | 'pvqc_custom' | 'pvqc_official'

// 測驗階段配置
export interface QuizStageConfig {
  stageId: string
  mode: QuizModeId
  questionCount: number
  timeLimit: number
  // 該階段及格題數（PVQC 官方模式才有；Spelling=40, 其餘=70）
  passingScore?: number
  // 顯示用名稱，如「測驗一：寫」
  label?: string
}

// 測驗流程配置
export interface QuizFlowConfig {
  id: string
  name: string
  type: 'single_stage' | 'multi_stage'
  stages: QuizStageConfig[]
  totalTimeLimit: number
  // 流程模式（舊資料可能無此欄位，讀取時 fallback）
  flowMode?: FlowMode
  // 是否啟用分階段強制計時（true=時間到強制換階段；false=維持舊全局計時行為）
  enforceStageTimer?: boolean
}

// 科目配置
export interface SubjectConfig {
  id: string
  name: string
  baseQuestionType: QuestionTypeId // 基礎題型
  flowConfig: QuizFlowConfig // 測驗流程配置
  quizOpen: boolean
  lockTime?: string[]
  questions: Question[]
}
