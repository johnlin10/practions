import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './PVQCSetup.scss'

// types
import { QuizModeId } from '../../types/quiz-modes'

// PVQC 測驗模式
const PVQC_MODES = [
  { id: 'pvqc_write', name: '測驗一：寫', desc: '看中拼英' },
  { id: 'pvqc_read', name: '測驗二：讀', desc: '看英選中' },
  { id: 'pvqc_listen_chinese', name: '測驗三：聽', desc: '聽英選中' },
  { id: 'pvqc_listen_english', name: '測驗四：聽', desc: '聽英選英' },
  { id: 'pvqc_pronunciation', name: '測驗五：聽', desc: '看中選發音' },
]

/**
 * [page] PVQCSetup component
 * PVQC 測驗設定頁面
 */
function PVQCSetup(): React.ReactElement {
  // 導航
  const navigate = useNavigate()
  // 選擇的測驗模式
  const [selectedModes, setSelectedModes] = useState<string[]>([])
  // 每個測驗題數
  const [questionCount, setQuestionCount] = useState<number>(50)
  // 每個測驗時間
  const [timePerStage, setTimePerStage] = useState<number>(10)

  /**
   * [function] toggleMode
   * 切換測驗模式
   * @param {string} modeId - 測驗模式 ID
   * @returns {void}
   */
  const toggleMode = (modeId: string): void => {
    setSelectedModes((prev) =>
      prev.includes(modeId)
        ? prev.filter((id) => id !== modeId)
        : [...prev, modeId]
    )
  }

  /**
   * [function] startPVQC
   * 開始 PVQC 測驗
   * @returns {void}
   */
  const startPVQC = (): void => {
    // 如果沒有選擇測驗模式，則提示使用者選擇測驗模式
    if (selectedModes.length === 0) {
      alert('請至少選擇一種測驗類型')
      return
    }

    // 計算總時限
    const totalTimeLimit = selectedModes.length * timePerStage

    // 建立測驗流程配置
    const flowConfig = {
      id: 'pvqc_custom',
      name: 'PVQC 自訂測驗',
      type: 'multi_stage' as const,
      stages: selectedModes
        .sort((a, b) => {
          const order = [
            'pvqc_write',
            'pvqc_read',
            'pvqc_listen_chinese',
            'pvqc_listen_english',
            'pvqc_pronunciation',
          ]
          return order.indexOf(a) - order.indexOf(b)
        })
        .map((modeId, index) => ({
          stageId: `stage_${index + 1}`,
          mode: modeId as QuizModeId,
          questionCount,
          timeLimit: timePerStage,
        })),
      totalTimeLimit,
    }

    // 導航到測驗頁面，並傳遞配置
    navigate('/quiz/pvqc_ai', {
      state: {
        customFlowConfig: flowConfig,
      },
    })
  }

  // 渲染 PVQC 測驗設定頁面
  return (
    <div className="page pvqc-setup-page">
      <div className="page-container">
        <h1>PVQC AI 測驗設定</h1>

        <div className="pvqc-setup-section">
          <h2>選擇測驗類型（可複選）</h2>
          <div className="mode-selection">
            {PVQC_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`mode-card ${
                  selectedModes.includes(mode.id) ? 'selected' : ''
                }`}
                onClick={() => toggleMode(mode.id)}
              >
                <span className="material-symbols-rounded">
                  {selectedModes.includes(mode.id)
                    ? 'check_box'
                    : 'check_box_outline_blank'}
                </span>
                <div>
                  <h3>{mode.name}</h3>
                  <p>{mode.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="pvqc-setup-section">
          <h2>測驗設定</h2>
          <div className="config-inputs">
            <label>
              每個測驗題數
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                min={5}
                max={50}
              />
            </label>
            <label>
              每個測驗時間
              <input
                type="number"
                value={timePerStage}
                onChange={(e) => setTimePerStage(Number(e.target.value))}
                min={1}
                max={30}
              />
              分鐘
            </label>
          </div>
        </div>

        <button
          className="pvqc-start-button"
          onClick={startPVQC}
          disabled={selectedModes.length === 0}
        >
          開始測驗
        </button>
      </div>
    </div>
  )
}

export default PVQCSetup
