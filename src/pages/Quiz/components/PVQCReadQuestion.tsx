import { VocabularyQuestion } from '../../../types/questions'
import { useState, useEffect } from 'react'
import './quiz-global.scss'
import './PVQCReadQuestion.scss'

interface Props {
  question: VocabularyQuestion
  options: string[] // 從外部傳入的選項（已緩存）
  currentAnswer?: string
  onSubmit: (questionId: string, answer: string) => void
}

/**
 * [component] PVQCReadQuestion component
 * PVQC 看英選中題目元件
 * @param {Props} props - 元件屬性
 * @param {VocabularyQuestion} props.question - 題目
 * @param {string[]} props.options - 選項
 * @param {string} props.currentAnswer - 當前答案
 * @param {() => void} props.onSubmit - 提交答案的回調函數
 * @returns {React.ReactElement} - PVQC 看英選中題目元件
 */
function PVQCReadQuestion({
  question,
  options,
  currentAnswer,
  onSubmit,
}: Props) {
  // 選擇的選項
  const [selectedOption, setSelectedOption] = useState<number | null>(null)

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
    // 設置選擇的選項
    setSelectedOption(index)
    // 獲取選擇的選項的實際內容
    // 提交選項的實際內容（中文翻譯），而不是索引
    const selectedAnswer = options[index]
    onSubmit(question.id, selectedAnswer)
  }

  return (
    <div className="question-block pvqc-read-question">
      <h3>請選擇正確的中文翻譯</h3>
      {/* 題目內容 */}
      <div className="question-content">
        {/* 題目顯示 */}
        <div className="question-prompt-container english-prompt">
          <p className="question-prompt">{question.english}</p>
        </div>

        {/* 答案選擇介面 */}
        <div className="options">
          {options.map((option, index) => (
            <button
              key={index}
              className={`option ${selectedOption === index ? 'selected' : ''}`}
              onClick={() => handleOptionClick(index)}
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

export default PVQCReadQuestion
