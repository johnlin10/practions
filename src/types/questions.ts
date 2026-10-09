// 題型 ID
export type QuestionTypeId =
  | 'single_choice' // 單選題
  | 'multiple_choice' // 多選題
  | 'true_false' // 是非題
  | 'vocabulary' // 單字題

// 題型名稱（混合題型的測驗、題庫篩選、紀錄分組顯示用）
export const QUESTION_TYPE_LABELS: Record<QuestionTypeId, string> = {
  single_choice: '單選題',
  multiple_choice: '多選題',
  true_false: '是非題',
  vocabulary: '單字題',
}

// 單選題
export interface SingleChoiceQuestion {
  type: 'single_choice'
  id: string
  question: string
  options: string[]
  correctIndex: number
}

// 多選題
export interface MultipleChoiceQuestion {
  type: 'multiple_choice'
  id: string
  question: string
  options: string[]
  correctIndexes: number[]
}

// 是非題
export interface TrueFalseQuestion {
  type: 'true_false'
  id: string
  question: string
  correctAnswer: boolean
}

// 單字題（基礎資料）
export interface VocabularyQuestion {
  type: 'vocabulary'
  id: string
  english: string
  chinese: string
}

// 聯合型別
export type Question =
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | VocabularyQuestion
