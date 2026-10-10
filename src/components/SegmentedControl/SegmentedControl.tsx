import React from 'react'
import './SegmentedControl.scss'

// interfaces
interface SegmentedControlProps<T extends string> {
  // 選項（依序由左到右）
  options: readonly { value: T; label: string; icon?: string }[]
  // 目前選中的值
  value: T
  // 選中值改變時的回調函數
  onChange: (value: T) => void
  // 無障礙標籤（螢幕閱讀器用）
  label: string
  // 大小：sm 為小型篩選器；lg 撐滿整行、選項平分寬度，文字較大
  size?: 'sm' | 'lg'
  // 額外的 class（外層間距等版面由使用處決定）
  className?: string
}

/**
 * [component] SegmentedControl component
 * 連在一起的選擇器：兩端帶圓角，選中的選項凸起，其餘保持平面（樣式同底部導航欄）；size 可選小型或撐滿整行的大型
 * @param {SegmentedControlProps} props - 選擇器屬性
 * @returns {React.ReactElement} - 選擇器元件
 */
function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  className,
}: SegmentedControlProps<T>): React.ReactElement {
  return (
    <div
      className={`segmented-control ${size}${className ? ` ${className}` : ''}`}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          className={option.value === value ? 'active' : undefined}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.icon && (
            <span className="material-symbols-rounded" aria-hidden="true">
              {option.icon}
            </span>
          )}
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default SegmentedControl
