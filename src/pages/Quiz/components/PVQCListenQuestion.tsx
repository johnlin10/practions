import { VocabularyQuestion } from '../../../types/questions'
import { useState, useRef, useEffect, useCallback } from 'react'
import './PVQCListenQuestion.scss'

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
  // 音訊元素引用
  const audioRef = useRef<HTMLAudioElement>(null)

  /**
   * [function] playAudio
   * 播放音訊
   * @returns {void}
   */
  const playAudio = useCallback(() => {
    // 如果瀏覽器支援語音合成
    if ('speechSynthesis' in window) {
      setIsPlaying(true)

      // 停止任何正在播放的語音
      window.speechSynthesis.cancel()

      // 創建語音合成實例
      const utterance = new SpeechSynthesisUtterance(question.english)

      // 設定語音參數
      utterance.lang = 'en-US' // 英文語音
      utterance.rate = 0.8 // 語速稍慢一點
      utterance.pitch = 1 // 音調
      utterance.volume = 1 // 音量

      // 播放結束事件
      utterance.onend = () => {
        setIsPlaying(false)
        setHasPlayed(true)
      }

      // 播放錯誤事件
      utterance.onerror = () => {
        setIsPlaying(false)
        setHasPlayed(true)
        console.warn('語音合成播放失敗')
      }

      // 開始播放
      window.speechSynthesis.speak(utterance)
    }
  }, [question.english])

  // 當題目切換時，重置播放狀態
  useEffect(() => {
    // 重置已播放狀態
    setHasPlayed(false)
    // 重置是否正在播放狀態
    setIsPlaying(false)
    // 停止任何正在播放的語音
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      // 延遲播放音訊
      setTimeout(() => {
        playAudio()
      }, 250)
    }
  }, [question.id, playAudio])

  // 元件卸載時清理語音合成
  useEffect(() => {
    // 元件卸載時清理語音合成
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
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

          {/* 音訊元素 */}
          <audio
            ref={audioRef}
            src={`/vocabulary-audio/${
              question.audioFile || `${question.english}.mp3`
            }`}
            preload="auto"
          />
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
