import { useState, useEffect } from 'react'
import './quiz-global.scss'
import './standard.scss'

// types
import { Question } from '../../../types/questions'

interface Props {
  question: Question
  currentAnswer?: string | number | number[] | boolean
  onSubmit: (
    questionId: string,
    answer: string | number | number[] | boolean
  ) => void
}

/**
 * [component] StandardQuestion component
 * 標準題目元件
 * @param {Props} props - 元件屬性
 * @param {Question} props.question - 題目
 * @param {string | number | number[] | boolean} props.currentAnswer - 當前答案
 * @param {() => void} props.onSubmit - 提交答案的回調函數
 * @returns {React.ReactElement} - 標準題目元件
 */
function StandardQuestion({ question, currentAnswer, onSubmit }: Props) {
  // 選擇的答案
  const [selectedAnswer, setSelectedAnswer] = useState<
    string | number | number[] | boolean | null
  >(currentAnswer !== undefined ? currentAnswer : null)

  // 當題目切換或已存在的答案改變時，更新 selectedAnswer
  useEffect(() => {
    // 設置選擇的答案
    setSelectedAnswer(currentAnswer !== undefined ? currentAnswer : null)
  }, [question.id, currentAnswer])

  /**
   * [function] renderSingleChoice
   * 單選題渲染
   * @returns {React.ReactElement} - 單選題渲染
   */
  const renderSingleChoice = () => {
    if (question.type !== 'single_choice') return null

    /**
     * [function] handleSingleSelect
     * 單選題選擇處理
     * @param index - 選擇的選項索引
     */
    const handleSingleSelect = (index: number) => {
      setSelectedAnswer(index)
      onSubmit(question.id, index)
    }

    // 渲染單選題
    return (
      <div className="options single-choice-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            className={`option ${selectedAnswer === index ? 'selected' : ''}`}
            onClick={() => handleSingleSelect(index)}
          >
            <span className="option-letter">
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        ))}
      </div>
    )
  }

  /**
   * [function] renderMultipleChoice
   * 多選題渲染
   * @returns {React.ReactElement} - 多選題渲染
   */
  const renderMultipleChoice = () => {
    // 如果題型不是多選題，則返回 null
    if (question.type !== 'multiple_choice') return null

    /**
     * [function] handleMultiSelect
     * 多選題選擇處理
     * @param index - 選擇的選項索引
     */
    const handleMultiSelect = (index: number) => {
      // 如果當前答案是數組，則獲取當前選擇
      const currentSelection = Array.isArray(selectedAnswer)
        ? selectedAnswer
        : []

      // 新的選擇
      let newSelection: number[]
      // 如果當前選擇包含選擇的選項索引，則取消選擇
      if (currentSelection.includes(index)) {
        // 取消選擇
        newSelection = currentSelection.filter((i) => i !== index)
      } else {
        // 新增選擇
        newSelection = [...currentSelection, index]
      }

      // 設置選擇的答案
      setSelectedAnswer(newSelection)
      // 提交答案
      onSubmit(question.id, newSelection)
    }

    // 渲染多選題
    return (
      <div className="options multiple-choice-options">
        {question.options.map((option, index) => {
          // 檢查是否已選擇
          // 如果當前答案是數組，並且包含選擇的選項索引，則已選擇
          const isSelected =
            Array.isArray(selectedAnswer) && selectedAnswer.includes(index)

          // 渲染多選題選項
          return (
            <button
              key={index}
              className={`option ${isSelected ? 'selected' : ''}`}
              onClick={() => handleMultiSelect(index)}
            >
              <span className="option-letter">
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </button>
          )
        })}
      </div>
    )
  }

  /**
   * [function] renderTrueFalse
   * 是非題渲染
   * @returns {React.ReactElement} - 是非題渲染
   */
  const renderTrueFalse = () => {
    // 如果題型不是是非題，則返回 null
    if (question.type !== 'true_false') return null

    /**
     * [function] handleTrueFalseSelect
     * 是非題選擇處理
     * @param answer - 選擇的答案
     */
    const handleTrueFalseSelect = (answer: boolean) => {
      setSelectedAnswer(answer)
      onSubmit(question.id, answer)
    }

    // 渲染是非題
    return (
      <div className="options true-false-options">
        <button
          className={`option ${selectedAnswer === true ? 'selected' : ''}`}
          onClick={() => handleTrueFalseSelect(true)}
        >
          <span className="material-symbols-outlined">circle</span>
        </button>
        <button
          className={`option ${selectedAnswer === false ? 'selected' : ''}`}
          onClick={() => handleTrueFalseSelect(false)}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    )
  }

  /**
   * [function] renderQuestionText
   * 渲染題目文字
   * @returns {React.ReactElement} - 渲染題目文字
   */
  const renderQuestionText = () => {
    // 根據題型渲染題目文字
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'true_false':
        return (
          <div className="question-prompt-container">
            <p className="question-prompt">{question.question}</p>
          </div>
        )

      case 'vocabulary':
        return (
          <div className="question-prompt-container">
            <p className="question-prompt">
              {question.chinese} ({question.english})
            </p>
          </div>
        )

      default:
        return (
          <div className="question-prompt-container">
            <p className="question-prompt">未知題型</p>
          </div>
        )
    }
  }
  return (
    <div className="question-block standard-question">
      <h3>請回答以下問題</h3>

      <div className="question-content">
        {/* 題目顯示 */}
        {renderQuestionText()}

        {/* 答案選擇介面 */}
        {renderSingleChoice()}
        {renderMultipleChoice()}
        {renderTrueFalse()}
      </div>
    </div>
  )
}

export default StandardQuestion
