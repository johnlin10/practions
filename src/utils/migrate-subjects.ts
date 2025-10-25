import { Question } from '../types/questions'

/**
 * [function] migrateQuestion
 * 將舊格式的 Question 轉換為新格式
 * 根據題目的屬性自動判斷題型並添加 type 屬性
 * @param {any} oldQuestion - 舊格式的 Question
 * @returns {Question} - 新格式的 Question
 */
export function migrateQuestion(oldQuestion: any): Question {
  // 單字題：有 english 和 chinese 屬性
  if (oldQuestion.english && oldQuestion.chinese) {
    return {
      type: 'vocabulary',
      id: oldQuestion.id,
      english: oldQuestion.english,
      chinese: oldQuestion.chinese,
      audioFile: oldQuestion.audioFile || oldQuestion.audioUrl, // 支援兩種命名
    }
  }

  // 是非題：有 correct 屬性
  if (oldQuestion.correct !== undefined) {
    return {
      type: 'true_false',
      id: oldQuestion.id,
      question: oldQuestion.question,
      correctAnswer: oldQuestion.correct,
    }
  }

  // 選擇題：有 correctIndex 屬性
  if (oldQuestion.correctIndex !== undefined) {
    // 多選題：correctIndex 是陣列
    if (Array.isArray(oldQuestion.correctIndex)) {
      return {
        type: 'multiple_choice',
        id: oldQuestion.id,
        question: oldQuestion.question,
        options: oldQuestion.options,
        correctIndexes: oldQuestion.correctIndex,
      }
    } else {
      // 單選題：correctIndex 是數字
      return {
        type: 'single_choice',
        id: oldQuestion.id,
        question: oldQuestion.question,
        options: oldQuestion.options,
        correctIndex: oldQuestion.correctIndex,
      }
    }
  }

  // 如果題目格式不合法，則拋出錯誤
  throw new Error(`Unknown question format: ${JSON.stringify(oldQuestion)}`)
}

/**
 * [function] migrateSubjects
 * 遷移整個 subjects 物件
 * @param {any} oldSubjects - 舊格式的 subjects
 * @returns {any} - 新格式的 subjects
 */
export function migrateSubjects(oldSubjects: any): any {
  // 遷移後的 subjects
  const migratedSubjects: any = {}
  // 遍歷 oldSubjects
  for (const [key, subject] of Object.entries(oldSubjects as any)) {
    // 將 subject 轉換為 Subject 類型
    const subjectObj = subject as any
    // 將 subject 添加到 migratedSubjects
    migratedSubjects[key] = {
      id: subjectObj.id,
      name: subjectObj.name,
      quizType: subjectObj.quizType,
      quizOpen: subjectObj.quizOpen,
      questionCount: subjectObj.questionCount,
      timeLimit: subjectObj.timeLimit,
      lockTime: subjectObj.lockTime,
      questions: subjectObj.questions.map((q: any) => migrateQuestion(q)),
    }
  }

  return migratedSubjects
}

/**
 * [function] generateMigratedCode
 * 生成遷移後的 TypeScript 程式碼
 * @param {any} migratedSubjects - 遷移後的 subjects
 * @returns {string} - 遷移後的 TypeScript 程式碼
 */
export function generateMigratedCode(migratedSubjects: any): string {
  return `import { Question } from '../types/questions'

// 定義舊格式的型別（向後兼容）
export interface Subject {
  id: string
  name: string
  quizType: string
  quizOpen: boolean
  questionCount: number
  timeLimit: number
  lockTime?: string[]
  questions: Question[]
}

export type Subjects = Record<string, Subject>

export const subjects: Subjects = ${JSON.stringify(migratedSubjects, null, 2)}
`
}
