/**
 * 檢查科目是否已鎖定
 * @param {Object} subject - 科目對象
 * @returns {boolean} - 是否鎖定
 */
export const isSubjectLocked = (subject) => {
  if (!subject?.lockTime) return false

  const [startTime, endTime] = subject.lockTime
  const now = new Date()
  const examStart = new Date(startTime)
  const examEnd = new Date(endTime)

  return now >= examStart && now <= examEnd
}

/**
 * 獲取科目鎖定狀態訊息
 * @param {Object} subject - 科目對象
 * @param {Date} currentTime - 當前時間
 * @returns {Object} - 鎖定狀態信息
 */
export const getLockStatus = (subject, currentTime) => {
  if (!subject?.lockTime) return { status: 'none' }

  const [startTime, endTime] = subject.lockTime
  const examStart = new Date(startTime)
  const examEnd = new Date(endTime)

  if (currentTime < examStart) {
    return {
      status: 'upcoming',
      time: startTime,
      text: '即將鎖定',
    }
  } else if (currentTime >= examStart && currentTime <= examEnd) {
    return {
      status: 'locked',
      time: endTime,
      text: '鎖定到 ',
    }
  } else {
    return { status: 'none' }
  }
}

/**
 * 根據題型獲取搜尋提示
 * @param {string} quizType - 題型
 * @returns {string} - 提示文字
 */
export const getSearchPlaceholder = (quizType) => {
  switch (quizType) {
    case 'once_choice':
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
 * 格式化鎖定時間
 * @param {string} time - 時間字串
 * @returns {string} - 格式化後的時間
 */
export const formatLockTime = (time) => {
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
