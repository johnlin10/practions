import React from 'react'
import './LearningCycle.scss'

// 學習循環的四個步驟，由上往下排，最後由右側的線繞回測驗
const STEPS = [
  {
    icon: 'assignment_turned_in',
    color: 'primary',
    name: '測驗・隨手練',
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
 * 學習循環圖：測驗・隨手練 → 錯題複習 → 再次確認 → 掌握度，右側的線繞回測驗。
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

// 首頁版的位置：四個步驟排成正方形的四個角放在圓環上，整組順時針轉 10°
const LOOP_ROTATION = 10
const LOOP_RADIUS = 144
const LOOP_CENTER_X = 169.5
const LOOP_CORNERS = [-135, -45, 45, 135]
const loopRad = (angle: number): number =>
  ((angle + LOOP_ROTATION) * Math.PI) / 180
// 圓心往下推到最上面的圖示貼齊頂端
const LOOP_CENTER_Y =
  28 + LOOP_RADIUS * Math.max(...LOOP_CORNERS.map((a) => -Math.sin(loopRad(a))))
const loopPoint = (angle: number): { x: number; y: number } => ({
  x: LOOP_CENTER_X + LOOP_RADIUS * Math.cos(loopRad(angle)),
  y: LOOP_CENTER_Y + LOOP_RADIUS * Math.sin(loopRad(angle)),
})
// 最下面的圖示再加上兩行說明的高度
const LOOP_HEIGHT = Math.ceil(
  Math.max(...LOOP_CORNERS.map((a) => loopPoint(a).y)) + 26 + 52,
)

// 圓環在文字與箭頭的位置斷開：首頁背景的方塊會從後面飄過，不能用底色蓋住圓環
// 文字範圍：步驟名稱在圖示中心下方 34px 起（14px 字），說明在 58px 起（12px 字），左右各多留 6px
const textGap = (
  centerX: number,
  top: number,
  text: string,
  fontSize: number,
): { x: number; y: number; width: number; height: number } => ({
  x: centerX - (text.length * fontSize) / 2 - 6,
  y: top,
  width: text.length * fontSize + 12,
  height: fontSize + 6,
})
const LOOP_GAPS = [
  ...STEPS.flatMap(({ name, text }, index) => {
    const { x, y } = loopPoint(LOOP_CORNERS[index])
    return [textGap(x, y + 34, name, 14), textGap(x, y + 58, text, 12)]
  }),
  // 兩個步驟中間的箭頭
  ...LOOP_CORNERS.map((corner) => {
    const { x, y } = loopPoint(corner + 45)
    return { x: x - 14, y: y - 14, width: 28, height: 28 }
  }),
]

/**
 * [component] LearningLoop
 * 首頁的學習循環圖：四個步驟在圓環上順時針繞一圈，中間是「每轉一圈，記得更牢」
 */
export function LearningLoop(): React.ReactElement {
  return (
    <div className="learning-loop" style={{ height: LOOP_HEIGHT }}>
      <svg className="learning-loop-ring" aria-hidden="true">
        <mask id="learning-loop-gaps">
          <rect width="100%" height="100%" fill="white" />
          {LOOP_GAPS.map((gap, index) => (
            <rect key={index} {...gap} rx={6} fill="black" />
          ))}
        </mask>
        <circle
          cx={LOOP_CENTER_X}
          cy={LOOP_CENTER_Y}
          r={LOOP_RADIUS}
          mask="url(#learning-loop-gaps)"
        />
      </svg>
      <span
        className="learning-loop-hub"
        style={{ left: LOOP_CENTER_X - 52, top: LOOP_CENTER_Y - 52 }}
      >
        <span>每轉一圈</span>
        <span>記得更牢</span>
      </span>
      {/* 兩個步驟中間的順時針箭頭 */}
      {LOOP_CORNERS.map((corner) => {
        const { x, y } = loopPoint(corner + 45)
        return (
          <span
            key={corner}
            className="learning-loop-arrow material-symbols-rounded"
            aria-hidden="true"
            style={{
              left: x - 14,
              top: y - 14,
              transform: `rotate(${corner + 45 + LOOP_ROTATION + 90}deg)`,
            }}
          >
            arrow_forward
          </span>
        )
      })}
      <ol aria-label="學習循環，最後回到測驗">
        {STEPS.map(({ name, text }, index) => {
          const { x, y } = loopPoint(LOOP_CORNERS[index])
          return (
            <li key={name} style={{ left: x - 56, top: y - 26 }}>
              <StepIcon step={index + 1} />
              <span className="learning-step-name">{name}</span>
              <span className="learning-step-text">{text}</span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default LearningCycle
