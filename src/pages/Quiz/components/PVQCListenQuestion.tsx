import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect, useCallback } from 'react'
import './PVQCListenQuestion.scss'
import { speakEnglish, cancelSpeech } from '../../../utils/tts'

interface Props {
  question: VocabularyQuestion
  options: string[] // 從外部傳入的選項（已緩存）
  mode: 'pvqc_listen_chinese' | 'pvqc_listen_english'
  currentAnswer?: string
  onSubmit: (questionId: string, answer: string) => void
}

/**
 * [component] PVQCListenQuestion component
 * PVQC 聽英文題目元件
 * @param {Props} props - 元件屬性
 * @param {VocabularyQuestion} props.question - 題目
 * @param {string[]} props.options - 選項
 * @param {'pvqc_listen_chinese' | 'pvqc_listen_english'} props.mode - 模式
 * @param {string} props.currentAnswer - 當前答案
 * @param {() => void} props.onSubmit - 提交答案的回調函數
 * @returns {React.ReactElement} - PVQC 聽英文題目元件
 */
function PVQCListenQuestion({
  question,
  options,
  mode,
  currentAnswer,
  onSubmit,
}: Props) {
  // 選擇的選項
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  // 是否正在播放
  const [isPlaying, setIsPlaying] = useState(false)
  // 是否已播放
  const [hasPlayed, setHasPlayed] = useState(false)

  /**
   * [function] playAudio
   * 播放瀏覽器內建語音
   */
  const playAudio = useCallback(() => {
    cancelSpeech()
    setIsPlaying(true)

    speakEnglish(question.english, {
      rate: 0.85,
      onEnd: () => {
        setIsPlaying(false)
        setHasPlayed(true)
      },
      onError: () => {
        setIsPlaying(false)
      },
    })
  }, [question.english])

  // 當題目切換時，重置狀態並自動播放。
  useEffect(() => {
    setHasPlayed(false)
    setIsPlaying(false)
    cancelSpeech()

    const t = setTimeout(() => {
      playAudio()
    }, 250)

    return () => clearTimeout(t)
  }, [question.id, playAudio])

  // 元件卸載時清理語音合成
  useEffect(() => {
    return () => {
      cancelSpeech()
    }
  }, [])

  // 當題目或答案改變時，更新已選擇的選項
  useEffect(() => {
    // 如果當前答案存在
    if (currentAnswer) {
      // 獲取當前答案的索引
      const index = options.indexOf(currentAnswer)
      setSelectedOption(index >= 0 ? index : null)
    } else {
      setSelectedOption(null)
    }
  }, [question.id, currentAnswer, options])

  /**
   * [function] handleOptionClick
   * 處理選項點擊 - 直接提交答案
   * @param index - 選擇的選項索引
   * @returns {void}
   */
  const handleOptionClick = (index: number) => {
    // 如果沒有播放音訊，則返回
    if (!hasPlayed) return
    // 設置選擇的選項
    setSelectedOption(index)
    // 提交選項的實際內容，而不是索引
    const selectedAnswer = options[index]
    // 提交答案
    onSubmit(question.id, selectedAnswer)
  }

  return (
    <div className="question-block pvqc-listen-question">
      <h3>
        {mode === 'pvqc_listen_chinese'
          ? '請聽英文，選擇正確的中文翻譯'
          : '請聽英文，選擇正確的英文單字'}
      </h3>

      <div className="question-content">
        <div className="audio-section">
          <div className="audio-controls">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className={`play-button ${isPlaying ? 'playing' : ''}`}
            >
              <span className="material-symbols-rounded">volume_up</span>
              {isPlaying ? '播放中...' : '播放音訊'}
            </button>
          </div>
        </div>

        <div className="options pvqc-listen-options">
          {!hasPlayed && selectedOption === null && (
            <p className="hint-text">請先播放音訊後再選擇答案</p>
          )}
          {options.map((option, index) => (
            <button
              key={index}
              className={`option ${selectedOption === index ? 'selected' : ''}`}
              onClick={() => handleOptionClick(index)}
              disabled={!hasPlayed && selectedOption === null}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PVQCListenQuestion
