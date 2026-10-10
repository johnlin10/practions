import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect } from 'react'
import './PVQCReadListenQuestion.scss'
import { speakEnglish, cancelSpeech } from '../../../utils/tts'
import { OptionMark, revealClass } from './option-mark'

interface Props {
  question: VocabularyQuestion
  pronunciationOptions: string[] // 從外部傳入的選項（已緩存）
  currentAnswer?: string
  // 即時回饋：已檢查，鎖定答案並標出對錯（仍可點選項重聽發音）
  reveal?: boolean
  onSubmit: (questionId: string, answer: string) => void
}

/**
 * [component] PVQCReadListenQuestion component
 * PVQC 測驗六：看英文聽選發音題目元件
 */
function PVQCReadListenQuestion({
  question,
  pronunciationOptions,
  currentAnswer,
  reveal = false,
  onSubmit,
}: Props) {
  const [isPlaying, setIsPlaying] = useState([false, false, false, false])
  const [submittedOption, setSubmittedOption] = useState<number | null>(null)

  useEffect(() => {
    setIsPlaying([false, false, false, false])
    setSubmittedOption(null)
  }, [question.id])

  useEffect(() => {
    if (currentAnswer) {
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

  const playAudio = (index: number) => {
    setIsPlaying((prev) => {
      const next = [...prev]
      next[index] = true
      return next
    })

    // 已檢查時只播放，不改答案
    if (!reveal) {
      const selectedAnswer = pronunciationOptions[index]
      setSubmittedOption(index)
      onSubmit(question.id, selectedAnswer)
    }

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
    <div className="question-block pvqc-read-listen-question">
      <h3>請聽各選項發音，選擇與英文單字相符的發音</h3>
      <div className="question-content">
        <div className="english-prompt">
          <p>{question.english}</p>
        </div>

        <div
          className={`options pronunciation-options${
            reveal ? ' revealed' : ''
          }`}
        >
          {pronunciationOptions.map((option, index) => {
            const mark = reveal
              ? revealClass(
                  option.toLowerCase() === question.english.toLowerCase(),
                  submittedOption === index,
                )
              : ''
            return (
              <div key={index} className="pronunciation-option">
                <button
                  className={`pronunciation-button ${
                    reveal ? mark : submittedOption === index ? 'selected' : ''
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
                  <OptionMark mark={mark} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PVQCReadListenQuestion
