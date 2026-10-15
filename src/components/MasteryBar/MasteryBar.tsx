import React from 'react'
import './MasteryBar.scss'
import { masteryPercent, type ModeMastery } from '@/data/mastery'
import { QUIZ_MODES } from '@/types/quiz-modes'

/**
 * [component] MasteryBar component
 * 掌握度的進度條（測驗頁科目卡片、PVQC 設定頁）；完全掌握時改成綠色
 */
function MasteryBar({ percent }: { percent: number }): React.ReactElement {
  return (
    <span
      className={`mastery-bar${percent === 100 ? ' complete' : ''}`}
      aria-hidden="true"
    >
      <span style={{ width: `${percent}%` }} />
    </span>
  )
}

/** 圓形的掌握度（單一題庫頁的掌握度按鈕），顏色同進度條。 */
export function MasteryRing({
  percent,
}: {
  percent: number
}): React.ReactElement {
  return (
    <svg
      className={`mastery-ring${percent === 100 ? ' complete' : ''}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <circle cx="10" cy="10" r="8.5" />
      {/* pathLength 設成 100，虛線長度直接用百分比；有掌握就至少畫一點，0.4% 也看得到 */}
      {percent > 0 && (
        <circle
          cx="10"
          cy="10"
          r="8.5"
          pathLength="100"
          strokeDasharray={`${Math.max(percent, 3)} 100`}
        />
      )}
    </svg>
  )
}

/** 掌握度百分比文字，完全掌握時是綠色。 */
export function MasteryPercent({
  percent,
}: {
  percent: number
}): React.ReactElement {
  return (
    <span className={percent === 100 ? 'mastery-complete' : undefined}>
      {percent}%
    </span>
  )
}

/** 單字題庫各作答方式的掌握度（PVQC 設定頁、題庫的掌握度彈窗）。 */
export function MasteryModes({
  modes,
}: {
  modes: ModeMastery[]
}): React.ReactElement {
  return (
    <div className="mastery-modes">
      {modes.map((m) => {
        const { name, description } = QUIZ_MODES[m.mode]
        return (
          <div key={m.mode}>
            <p>
              {name.replace('PVQC ', '')}
              <span>{description}</span>
            </p>
            <MasteryBar percent={masteryPercent(m)} />
            <strong className={m.practiced ? '' : 'not-practiced'}>
              {m.practiced ? (
                <MasteryPercent percent={masteryPercent(m)} />
              ) : (
                '還沒練習'
              )}
            </strong>
          </div>
        )
      })}
    </div>
  )
}

export default MasteryBar
