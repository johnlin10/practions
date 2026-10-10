import { Question, QuestionTypeId } from './questions'
import { QuizModeId } from './quiz-modes'
import type { SubjectGroupId } from '../data/subject-groups'

// 測驗流程模式：標準單階段、PVQC 自訂、PVQC 官方模擬、錯題複習
export type FlowMode = 'standard' | 'pvqc_custom' | 'pvqc_official' | 'review'

// 測驗階段配置
export interface QuizStageConfig {
  stageId: string
  mode: QuizModeId
  questionCount: number
  // 出題組成：各題型抽幾題（混合題型的題庫才有），抽完全部打散
  composition?: Partial<Record<QuestionTypeId, number>>
  // 只從這些題目出題（錯題複習用）
  questionIds?: string[]
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
  // 即時回饋（錯題複習）：答一題就檢查對錯，答錯的題目在該階段最後再練一次
  instantFeedback?: boolean
}

// 科目配置
export interface SubjectConfig {
  id: string
  name: string
  baseQuestionType: QuestionTypeId // 基礎題型
  flowConfig: QuizFlowConfig // 測驗流程配置
  quizOpen: boolean
  lockTime?: string[]
  group?: SubjectGroupId // 所屬題組（見 data/subject-groups.ts）
  questions: Question[]
}
