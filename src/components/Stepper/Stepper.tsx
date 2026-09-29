import React, { useEffect, useRef } from 'react'
import './Stepper.scss'

// interfaces
interface StepperProps {
  // 目前的值
  value: number
  // 可調整的範圍（含）
  min: number
  max: number
  // 每次增減的量，以 min 為起點對齊（預設 1）
  step?: number
  // 值改變時的回調函數
  onChange: (value: number) => void
  // 數字後方的單位
  unit?: string
  // 無障礙標籤（螢幕閱讀器用）
  label: string
}

// 長按：按下後先等待，再以遞減的間隔連續增減
const HOLD_DELAY = 400
const MIN_INTERVAL = 50

/**
 * [component] Stepper component
 * 以 − / + 調整數字，長按可連續增減
 * @param {StepperProps} props - 步進器屬性
 * @returns {React.ReactElement} - 步進器元件
 */
function Stepper({
  value,
  min,
  max,
  step: stepSize = 1,
  onChange,
  unit,
  label,
}: StepperProps): React.ReactElement {
  // 連續增減時，值還沒重新渲染，需靠 ref 取得最新值
  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  })
  const timerRef = useRef<number>()

  const stop = (): void => window.clearTimeout(timerRef.current)
  useEffect(() => stop, [])

  // 增減一次；到達邊界時回傳 false，停止連續增減
  // 值不在刻度上（例如舊資料）時，先對齊到最近的刻度
  const step = (dir: 1 | -1): boolean => {
    const k = (valueRef.current - min) / stepSize
    const target =
      min + (dir > 0 ? Math.floor(k) + 1 : Math.ceil(k) - 1) * stepSize
    const next = Math.min(max, Math.max(min, target))
    if (next === valueRef.current) return false
    valueRef.current = next
    onChange(next)
    return true
  }

  const startHold = (dir: 1 | -1): void => {
    stop()
    const tick = (delay: number): void => {
      if (!step(dir)) return
      timerRef.current = window.setTimeout(
        () => tick(Math.max(MIN_INTERVAL, delay * 0.85)),
        delay,
      )
    }
    tick(HOLD_DELAY)
  }

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="減少"
        disabled={value <= min}
        onPointerDown={() => startHold(-1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        // 鍵盤（Enter / Space）觸發的 click 沒有指標事件，detail 為 0
        onClick={(e) => e.detail === 0 && step(-1)}
        // 阻止手機長按時跳出選單
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="material-symbols-rounded">remove</span>
      </button>
      <output className="stepper-value">
        {value}
        {unit && <span className="unit">{unit}</span>}
      </output>
      <button
        type="button"
        aria-label="增加"
        disabled={value >= max}
        onPointerDown={() => startHold(1)}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        // 鍵盤（Enter / Space）觸發的 click 沒有指標事件，detail 為 0
        onClick={(e) => e.detail === 0 && step(1)}
        // 阻止手機長按時跳出選單
        onContextMenu={(e) => e.preventDefault()}
      >
        <span className="material-symbols-rounded">add</span>
      </button>
    </div>
  )
}

export default Stepper
