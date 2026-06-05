import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PVQCSetup.scss'

// types
import { QuizModeId } from '../../types/quiz-modes'
import { QuizFlowConfig } from '../../types/quiz-flows'

// hooks
import { usePVQCSettings } from '../../hooks/useSettings'

// data
import { buildOfficialFlow } from '../../data/pvqc-official'

// 設定模式
type SetupMode = 'official' | 'custom'

// PVQC 測驗模式（自訂用）
const PVQC_MODES = [
  { id: 'pvqc_write', name: '測驗一：寫', desc: '看中拼英' },
  { id: 'pvqc_read', name: '測驗二：讀', desc: '看英選中' },
  { id: 'pvqc_listen_chinese', name: '測驗三：聽', desc: '聽英選中' },
  { id: 'pvqc_listen_english', name: '測驗四：聽', desc: '聽英選英' },
  { id: 'pvqc_pronunciation', name: '測驗五：聽', desc: '看中選發音' },
  { id: 'pvqc_read_listen', name: '測驗六：讀聽', desc: '看英聽選發音' },
]

/**
 * [page] PVQCSetup component
 * PVQC 測驗設定頁面
 */
function PVQCSetup(): React.ReactElement {
  // 導航
  const navigate = useNavigate()
  // PVQC 設定
  const { pvqcSettings } = usePVQCSettings()
  // 設定模式：官方模擬 / 自訂測驗
  const [setupMode, setSetupMode] = useState<SetupMode>('official')
  // 官方模式：是否包含 Spelling 選考
  const [includeSpelling, setIncludeSpelling] = useState<boolean>(true)
  // 選擇的測驗模式
  const [selectedModes, setSelectedModes] = useState<string[]>([])
  // 每個測驗題數
  const [questionCount, setQuestionCount] = useState<number>(pvqcSettings.defaultQuestionCount)
  // 每個測驗時間
  const [timePerStage, setTimePerStage] = useState<number>(pvqcSettings.defaultTimePerStage)

  // 當設定改變時，更新本地狀態（如果用戶還沒修改過）
  useEffect(() => {
    setQuestionCount(pvqcSettings.defaultQuestionCount)
    setTimePerStage(pvqcSettings.defaultTimePerStage)
  }, [pvqcSettings.defaultQuestionCount, pvqcSettings.defaultTimePerStage])

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
    let flowConfig: QuizFlowConfig

    if (setupMode === 'official') {
      flowConfig = buildOfficialFlow(includeSpelling)
      const stageCount = flowConfig.stages.length
      const totalMin = flowConfig.totalTimeLimit
      const ok = window.confirm(
        `即將開始 PVQC 官方模擬：\n` +
          `· ${stageCount} 階段，總時長 ${totalMin} 分鐘\n` +
          `· 每階段 100 題，時間到自動進入下一階段\n` +
          `· 不可中途調整設定\n\n` +
          `確定要開始嗎？`
      )
      if (!ok) return
    } else {
      // 自訂模式
      if (selectedModes.length === 0) {
        alert('請至少選擇一種測驗類型')
        return
      }
      const totalTimeLimit = selectedModes.length * timePerStage
      flowConfig = {
        id: 'pvqc_custom',
        name: 'PVQC 自訂測驗',
        type: 'multi_stage',
        flowMode: 'pvqc_custom',
        enforceStageTimer: false,
        stages: selectedModes
          .sort((a, b) => {
            const order = [
              'pvqc_write',
              'pvqc_read',
              'pvqc_listen_chinese',
              'pvqc_listen_english',
              'pvqc_pronunciation',
              'pvqc_read_listen',
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
    }

    // 導航到測驗頁面，並傳遞配置
    navigate('/quiz/pvqc_ai', {
      state: {
        customFlowConfig: flowConfig,
      },
    })
  }

  const isStartDisabled =
    setupMode === 'custom' && selectedModes.length === 0

  // 官方模擬模式預覽資訊
  const officialPreview = buildOfficialFlow(includeSpelling)

  // 渲染 PVQC 測驗設定頁面
  return (
    <div className="page pvqc-setup-page">
      <div className="page-container">
        <h1>PVQC 測驗設定</h1>

        {/* 模式切換 */}
        <div className="setup-mode-switch">
          <button
            className={`setup-mode-tab ${
              setupMode === 'official' ? 'active' : ''
            }`}
            onClick={() => setSetupMode('official')}
          >
            <span className="material-symbols-rounded">verified</span>
            官方模擬
          </button>
          <button
            className={`setup-mode-tab ${
              setupMode === 'custom' ? 'active' : ''
            }`}
            onClick={() => setSetupMode('custom')}
          >
            <span className="material-symbols-rounded">tune</span>
            自訂測驗
          </button>
        </div>

        {setupMode === 'official' ? (
          <>
            <div className="pvqc-setup-section">
              <h2>PVQC 官方模擬</h2>
              <p className="setup-description">
                依官方規範：每階段 100 題，時間到自動進入下一階段，未作答視為錯誤。
                所有階段都需達到及格門檻才算整體通過。
              </p>

              <label className="spelling-toggle">
                <input
                  type="checkbox"
                  checked={includeSpelling}
                  onChange={(e) => setIncludeSpelling(e.target.checked)}
                />
                <span>
                  包含 <strong>Spelling 選考</strong>（測驗一：看中拼英 / 20 分鐘 / 及格 40）
                </span>
              </label>

              <div className="official-stages-preview">
                {officialPreview.stages.map((stage, idx) => (
                  <div className="official-stage-row" key={stage.stageId}>
                    <span className="stage-index">{idx + 1}</span>
                    <span className="stage-label">{stage.label}</span>
                    <span className="stage-meta">
                      {stage.timeLimit} 分鐘 · {stage.questionCount} 題 · 及格{' '}
                      {stage.passingScore}
                    </span>
                  </div>
                ))}
                <div className="official-stage-total">
                  共 {officialPreview.stages.length} 階段，總時長{' '}
                  {officialPreview.totalTimeLimit} 分鐘
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}

        <button
          className="pvqc-start-button"
          onClick={startPVQC}
          disabled={isStartDisabled}
        >
          {setupMode === 'official' ? '開始官方模擬' : '開始測驗'}
        </button>
      </div>
    </div>
  )
}

export default PVQCSetup
