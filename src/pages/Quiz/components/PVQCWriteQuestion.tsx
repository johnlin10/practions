import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect } from 'react'
import './PVQCWriteQuestion.scss'

interface Props {
  question: VocabularyQuestion
  currentAnswer?: string
  onSubmit: (questionId: string, answer: string) => void
  onNext?: () => void
}

/**
 * [component] PVQCWriteQuestion component
 * PVQC 拼寫題目元件
 * @param {Props} props - 元件屬性
 * @param {VocabularyQuestion} props.question - 題目
 * @param {string} props.currentAnswer - 當前答案
 * @param {() => void} props.onSubmit - 提交答案的回調函數
 * @param {() => void} props.onNext - 下一題的回調函數
 * @returns {React.ReactElement} - PVQC 拼寫題目元件
 */
function PVQCWriteQuestion({
  question,
  currentAnswer,
  onSubmit,
  onNext,
}: Props) {
  // 輸入框的值
  const [input, setInput] = useState(currentAnswer || '')

  // 當題目切換時，更新輸入框內容
  useEffect(() => {
    // 設置輸入框的值
    setInput(currentAnswer || '')
  }, [question.id, currentAnswer])

  /**
   * [function] handleNext
   * 處理下一題
   * @returns {void}
   */
  const handleNext = () => {
    if (onNext) {
      onNext()
    }
  }

  return (
    <div className="question-block pvqc-write-question">
      <h3>請拼寫英文單字</h3>
      <div className="question-content">
        <div className="chinese-prompt">
          <p>{question.chinese}</p>
          {/* <p>{question.english}</p> */}
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => {
            // 允許字元：a-zA-Z 和 空格 和 -
            const value = e.target.value.replace(/[^a-zA-Z\s-]/g, '')
            setInput(value)
            onSubmit(question.id, value.trim())
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleNext()}
          placeholder="輸入英文單字"
          autoFocus
        />
      </div>
    </div>
  )
}

export default PVQCWriteQuestion
