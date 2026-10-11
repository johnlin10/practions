import React from 'react'
import './LearningCycle.scss'

// 學習循環的四個步驟，由上往下排，最後由右側的線繞回測驗
const STEPS = [
  {
    icon: 'assignment_turned_in',
    color: 'primary',
    name: '測驗',
    text: '找出不會的',
  },
  { icon: 'replay', color: 'review', name: '錯題複習', text: '把不會的練到會' },
  {
    icon: 'event_repeat',
    color: 'review',
    name: '再次確認',
    text: '隔一段時間還記得',
  },
  {
    icon: 'trending_up',
    color: 'success',
    name: '掌握度',
    text: '看見自己的進度',
  },
]

/** 學習循環某一步的彩色圖示（step 從 1 開始）。 */
export function StepIcon({ step }: { step: number }): React.ReactElement {
  const { icon, color } = STEPS[step - 1]
  return (
    <span
      className={`learning-icon ${color} material-symbols-rounded fill`}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}

/**
 * [component] LearningCycle
 * 學習循環圖：測驗 → 錯題複習 → 再次確認 → 掌握度，右側的線繞回測驗。
 * 學習系統引導與首頁共用
 */
function LearningCycle(): React.ReactElement {
  return (
    <div className="learning-cycle">
      <ol aria-label="學習循環，最後回到測驗">
        {STEPS.map(({ name, text }, index) => (
          <li key={name}>
            <StepIcon step={index + 1} />
            <span className="learning-step-name">{name}</span>
            <span className="learning-step-text">{text}</span>
            {index < STEPS.length - 1 && (
              <span
                className="learning-arrow material-symbols-rounded"
                aria-hidden="true"
              >
                arrow_downward
              </span>
            )}
          </li>
        ))}
      </ol>
      {/* 從掌握度繞回測驗的線 */}
      <span className="learning-cycle-return" aria-hidden="true">
        <span>
          <span className="material-symbols-rounded">arrow_left</span>
        </span>
      </span>
    </div>
  )
}

export default LearningCycle
