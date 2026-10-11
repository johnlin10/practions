import React from 'react'
import './MasteryBar.scss'

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

export default MasteryBar
