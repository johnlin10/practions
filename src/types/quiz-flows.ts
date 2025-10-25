import { Question, QuestionTypeId } from './questions'
import { QuizModeId } from './quiz-modes'

// 測驗階段配置
export interface QuizStageConfig {
  stageId: string
  mode: QuizModeId
  questionCount: number
  timeLimit: number
}

// 測驗流程配置
export interface QuizFlowConfig {
  id: string
  name: string
  type: 'single_stage' | 'multi_stage'
  stages: QuizStageConfig[]
  totalTimeLimit: number
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
