import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect } from 'react'

interface Props {
  question: VocabularyQuestion
  pronunciationOptions: string[] // 從外部傳入的選項（已緩存）
  currentAnswer?: string
  onSubmit: (questionId: string, answer: string) => void
}

/**
 * [component] PVQCPronunciationQuestion component
 * PVQC 發音題目元件
 * @param {Props} props - 元件屬性
 * @param {VocabularyQuestion} props.question - 題目
 * @param {string[]} props.pronunciationOptions - 發音選項
 * @param {string} props.currentAnswer - 當前答案
 * @param {() => void} props.onSubmit - 提交答案的回調函數
 * @returns {React.ReactElement} - PVQC 發音題目元件
 */
function PVQCPronunciationQuestion({
  question,
  pronunciationOptions,
  currentAnswer,
  onSubmit,
}: Props) {
  // 是否正在播放
  const [isPlaying, setIsPlaying] = useState([false, false, false, false])
  // 已提交的選項
  const [submittedOption, setSubmittedOption] = useState<number | null>(null)

  /**
   * [function] useEffect
   * 當題目改變時，重置狀態
   * @returns {void}
   */
  useEffect(() => {
    setIsPlaying([false, false, false, false])
    setSubmittedOption(null)
  }, [question.id])

  // 當答案改變時，更新已提交的選項
  useEffect(() => {
    // 如果當前答案存在
    if (currentAnswer) {
      // 獲取當前答案的索引
      const index = pronunciationOptions.indexOf(currentAnswer)
      setSubmittedOption(index >= 0 ? index : null)
    } else {
      setSubmittedOption(null)
    }
  }, [question.id, currentAnswer, pronunciationOptions])

  /**
   * [function] playAudio
   * 播放發音並提交答案
   * @param index - 播放的選項索引
   * @returns {void}
   */
  const playAudio = (index: number) => {
    // 如果瀏覽器支援語音合成
    if ('speechSynthesis' in window) {
      // 設置正在播放的狀態
      setIsPlaying((prev) => {
        const newIsPlaying = [...prev]
        newIsPlaying[index] = true
        return newIsPlaying
      })

      // 立即提交答案
      const selectedAnswer = pronunciationOptions[index]
      setSubmittedOption(index)
      onSubmit(question.id, selectedAnswer)

      // 停止任何正在播放的語音
      window.speechSynthesis.cancel()

      // 創建語音合成實例
      const utterance = new SpeechSynthesisUtterance(
        pronunciationOptions[index]
      )

      // 設定語音參數
      utterance.lang = 'en-US' // 英文語音
      utterance.rate = 0.8 // 語速稍慢一點
      utterance.pitch = 1 // 音調
      utterance.volume = 1 // 音量

      // 播放結束事件
      utterance.onend = () => {
        setIsPlaying((prev) => {
          const newIsPlaying = [...prev]
          newIsPlaying[index] = false
          return newIsPlaying
        })
      }

      // 播放錯誤事件
      utterance.onerror = () => {
        setIsPlaying((prev) => {
          const newIsPlaying = [...prev]
          newIsPlaying[index] = false
          return newIsPlaying
        })
        console.warn('語音合成播放失敗')
      }

      // 開始播放
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="question-block pvqc-pronunciation-question">
      <h3>請選擇正確的英文發音</h3>
      <div className="question-content">
        <div className="chinese-prompt">
          <p>{question.chinese}</p>
        </div>

        <div className="options pronunciation-options">
          {pronunciationOptions.map((_, index) => (
            <div key={index} className="pronunciation-option">
              <button
                className={`pronunciation-button ${
                  submittedOption === index ? 'selected' : ''
                }`}
                onClick={() => playAudio(index)}
              >
                <span className="material-symbols-rounded">
                  {isPlaying[index] ? 'volume_up' : 'play_arrow'}
                </span>
                <span className="option-letter">
                  {String.fromCharCode(65 + index)}
                </span>
                {isPlaying[index] ? '播放中...' : '播放發音'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PVQCPronunciationQuestion
