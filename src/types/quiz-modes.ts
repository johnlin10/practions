import { QuestionTypeId } from './questions'

// 測驗模式 ID
export type QuizModeId =
  | 'standard' // 標準
  | 'pvqc_write' // PVQC 測驗一：看中拼英
  | 'pvqc_read' // PVQC 測驗二：看英選中
  | 'pvqc_listen_chinese' // PVQC 測驗三：聽英選中
  | 'pvqc_listen_english' // PVQC 測驗四：聽英選英
  | 'pvqc_pronunciation' // PVQC 測驗五：看中選英發音
  | 'pvqc_read_listen' // PVQC 測驗六：看英聽選發音

// 答案類型
export type AnswerType =
  | 'text'
  | 'single_choice'
  | 'multiple_choice'
  | 'dynamic'

// 測驗模式配置
export interface QuizModeConfig {
  id: QuizModeId
  name: string
  description: string
  // 適用的題型
  compatibleQuestionTypes: QuestionTypeId[]
  // 答案類型：'dynamic' 表示根據題目類型動態決定
  answerType: AnswerType
  // 是否需要音訊
  requiresAudio: boolean
}

//* 測驗模式配置表
export const QUIZ_MODES: Record<QuizModeId, QuizModeConfig> = {
  standard: {
    id: 'standard',
    name: '標準',
    description: '',
    compatibleQuestionTypes: ['single_choice', 'multiple_choice', 'true_false'],
    answerType: 'dynamic', // 根據題目類型動態決定
    requiresAudio: false,
  },
  pvqc_write: {
    id: 'pvqc_write',
    name: 'PVQC 測驗一：寫',
    description: '看中拼英',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text',
    requiresAudio: false,
  },
  pvqc_read: {
    id: 'pvqc_read',
    name: 'PVQC 測驗二：讀',
    description: '看英選中',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text', // 提交選項內容（字符串）
    requiresAudio: false,
  },
  pvqc_listen_chinese: {
    id: 'pvqc_listen_chinese',
    name: 'PVQC 測驗三：聽',
    description: '聽英選中',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text', // 提交選項內容（字符串）
    requiresAudio: true,
  },
  pvqc_listen_english: {
    id: 'pvqc_listen_english',
    name: 'PVQC 測驗四：聽',
    description: '聽英選英',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text', // 提交選項內容（字符串）
    requiresAudio: true,
  },
  pvqc_pronunciation: {
    id: 'pvqc_pronunciation',
    name: 'PVQC 測驗五：聽',
    description: '看中選發音',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text', // 提交選項內容（字符串）
    requiresAudio: true,
  },
  pvqc_read_listen: {
    id: 'pvqc_read_listen',
    name: 'PVQC 測驗六：讀聽',
    description: '看英聽選發音',
    compatibleQuestionTypes: ['vocabulary'],
    answerType: 'text', // 提交選項內容（字符串）
    requiresAudio: true,
  },
}
