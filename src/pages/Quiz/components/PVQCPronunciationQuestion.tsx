import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect } from 'react'
import './PVQCPronunciationQuestion.scss'
import { speakEnglish, cancelSpeech } from '../../../utils/tts'

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

  // 元件卸載時清理語音合成
  useEffect(() => {
    return () => {
      cancelSpeech()
    }
  }, [])

  /**
   * [function] playAudio
   * 播放發音並提交答案
   */
  const playAudio = (index: number) => {
    setIsPlaying((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })

    // 立即提交答案
    const selectedAnswer = pronunciationOptions[index]
    setSubmittedOption(index)
    onSubmit(question.id, selectedAnswer)

    const clearPlaying = () => {
      setIsPlaying((prev) => {
        const next = [...prev]
        next[index] = false
        return next
      })
    }

    speakEnglish(pronunciationOptions[index], {
      rate: 0.85,
      onEnd: clearPlaying,
      onError: () => {
        clearPlaying()
        console.warn('語音合成播放失敗')
      },
    })
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
