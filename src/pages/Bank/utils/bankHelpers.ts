import { SubjectConfig } from '../../../types/quiz-flows'
import { QuestionTypeId } from '../../../types/questions'

// types
export type LockStatus = 'none' | 'upcoming' | 'locked'

// interfaces
export interface LockStatusInfo {
  status: LockStatus
  time?: string
  text?: string
}

/**
 * [function] isSubjectLocked
 * 檢查科目是否已鎖定
 * @param {SubjectConfig} subject - 科目物件
 * @returns {boolean} - 是否鎖定
 */
export const isSubjectLocked = (subject: SubjectConfig): boolean => {
  // 如果科目不存在，則返回 false
  if (!subject?.lockTime) return false
  // 獲取科目鎖定時間
  const [startTime, endTime] = subject.lockTime
  // 當前時間
  const now = new Date()
  // 考試開始時間
  const examStart = new Date(startTime)
  // 考試結束時間
  const examEnd = new Date(endTime)

  // 返回是否鎖定
  return now >= examStart && now <= examEnd
}

/**
 * [function] getLockStatus
 * 獲取科目鎖定狀態訊息
 * @param {SubjectConfig} subject - 科目物件
 * @param {Date} currentTime - 當前時間
 * @returns {LockStatusInfo} - 鎖定狀態信息
 */
export const getLockStatus = (
  subject: SubjectConfig,
  currentTime: Date
): LockStatusInfo => {
  // 如果科目不存在，則返回 none
  if (!subject?.lockTime) return { status: 'none' }
  // 獲取科目鎖定時間
  const [startTime, endTime] = subject.lockTime
  // 考試開始時間
  const examStart = new Date(startTime)
  // 考試結束時間
  const examEnd = new Date(endTime)

  // 返回鎖定狀態信息
  if (currentTime < examStart) {
    // 即將鎖定
    return {
      status: 'upcoming',
      time: startTime,
      text: '即將鎖定',
    }
  } else if (currentTime >= examStart && currentTime <= examEnd) {
    // 鎖定中
    return {
      status: 'locked',
      time: endTime,
      text: '鎖定到 ',
    }
  } else {
    // 未鎖定
    return { status: 'none' }
  }
}

/**
 * [function] getSearchPlaceholder
 * 根據題型獲取搜尋提示
 * @param {QuestionTypeId} questionType - 題型
 * @returns {string} - 搜尋提示文字
 */
export const getSearchPlaceholder = (questionType: QuestionTypeId): string => {
  // 根據題型返回搜尋提示文字
  switch (questionType) {
    case 'single_choice':
    case 'multiple_choice':
      return '搜尋題目、選項或 # 開頭搜尋題號'
    case 'true_false':
      return '搜尋題目或 # 開頭搜尋題號'
    case 'vocabulary':
      return '搜尋英文或中文單字'
    default:
      return '輸入關鍵字搜尋'
  }
}

/**
 * [function] formatLockTime
 * 格式化鎖定時間
 * @param {string} time - 時間字串
 * @returns {string} - 格式化後的時間
 */
export const formatLockTime = (time: string): string => {
  // 格式化時間
  return new Date(time)
    .toLocaleString('zh-TW', {
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    .replace(/\//g, '.')
}
