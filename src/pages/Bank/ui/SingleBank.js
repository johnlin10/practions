import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subjects } from '../../../data/subjects'
import '../Bank.scss'
import {
  isSubjectLocked,
  getLockStatus,
  getSearchPlaceholder,
  formatLockTime,
} from '../utils/bankHelpers'

const SingleBank = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  const [pageAnimation, setPageAnimation] = useState(true)

  useEffect(() => {
    setPageAnimation(false)
  }, [])

  // update current time
  useEffect(() => {
    setCurrentTime(new Date())

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  // render question content
  const renderQuestionContent = (question) => {
    // render different formats based on different question types
    if (subjects[subjectId].quizType === 'once_choice') {
      // once choice
      return (
        <div key={question.id} className="question-item">
          <div className="question-header">
            <span className="question-number">#{question.id}</span>
            <p className="question-text">{question.question}</p>
          </div>
          <div className="options">
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                className={`option ${
                  idx === question.correctIndex ? 'correct-answer' : ''
                }`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </div>
            ))}
          </div>
          <div className="answer-info">
            <span className="answer-label">正確答案：</span>
            <span className="answer">
              {String.fromCharCode(65 + question.correctIndex)}
            </span>
          </div>
        </div>
      )
    } else if (subjects[subjectId].quizType === 'multiple_choice') {
      // multiple choice
      return (
        <div key={question.id} className="question-item">
          <div className="question-header">
            <span className="question-number">#{question.id}</span>
            <p className="question-text">{question.question}</p>
          </div>
          <div className="options">
            {question.options?.map((option, idx) => (
              <div
                key={idx}
                className={`option ${
                  question.correctIndex.includes(idx) ? 'correct-answer' : ''
                }`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </div>
            ))}
          </div>
        </div>
      )
    } else if (subjects[subjectId].quizType === 'true_false') {
      // true false
      return (
        <div key={question.id} className="question-item">
          <div className="question-header true-false">
            <span className="question-number">#{question.id}</span>
            {question.correct ? (
              <span className="true-answer">O</span>
            ) : (
              <span className="false-answer">X</span>
            )}
            <p className="question-text">{question.question}</p>
          </div>
        </div>
      )
    } else if (subjects[subjectId].quizType === 'vocabulary') {
      // vocabulary
      return (
        <div className="vocabulary-content">
          <div className="word">
            <span className="english">{question.english}</span>
            <span className="chinese">{question.chinese}</span>
          </div>
        </div>
      )
    }
    return null
  }

  // 過濾題目
  const getFilteredQuestions = () => {
    if (!subjectId || isLocked) return []

    const currentQuestions = subjects[subjectId].questions
    const quizType = subjects[subjectId].quizType

    if (!searchTerm) return currentQuestions

    // 通用的 ID 搜尋邏輯
    if (searchTerm.startsWith('#')) {
      const idSearch = searchTerm.slice(1)
      return currentQuestions.filter((q) => q.id?.toString() === idSearch)
    }

    // 根據不同題型進行搜尋
    switch (quizType) {
      case 'once_choice':
      case 'multiple_choice':
        return currentQuestions.filter(
          (q) =>
            q.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.options?.some((option) =>
              option.toLowerCase().includes(searchTerm.toLowerCase())
            )
        )

      case 'true_false':
        return currentQuestions.filter((q) =>
          q.question?.toLowerCase().includes(searchTerm.toLowerCase())
        )

      case 'vocabulary':
        return currentQuestions.filter(
          (word) =>
            word.english?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            word.chinese?.includes(searchTerm)
        )

      default:
        // 預設搜尋邏輯，嘗試在所有可能的文字欄位中查找
        return currentQuestions.filter((q) => {
          // 檢查對象的所有值是否包含搜尋詞
          return Object.values(q).some((value) => {
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm.toLowerCase())
            } else if (Array.isArray(value)) {
              return value.some(
                (item) =>
                  typeof item === 'string' &&
                  item.toLowerCase().includes(searchTerm.toLowerCase())
              )
            }
            return false
          })
        })
    }
  }

  // check lock status
  useEffect(() => {
    if (!subjectId) {
      setIsLocked(false)
      return
    }
    setIsLocked(isSubjectLocked(subjects[subjectId]))
  }, [subjectId])
  const checkLockStatus = useCallback(() => {
    if (!subjectId) {
      setIsLocked(false)
      return
    }

    setIsLocked(isSubjectLocked(subjects[subjectId]))
  }, [subjectId])
  useEffect(() => {
    checkLockStatus()

    // check lock status every 10 seconds
    const intervalId = setInterval(() => {
      checkLockStatus()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [subjectId, checkLockStatus])

  // handle back button
  const handleBack = () => {
    navigate('/bank')
  }

  return (
    <div className={`single-bank ${pageAnimation ? 'page-animation' : ''}`}>
      <div className="single-bank-container">
        {subjectId && (
          <>
            <h2>
              {subjects[subjectId].name}
              {subjects[subjectId].lockTime && (
                <>
                  {(() => {
                    const status = getLockStatus(
                      subjects[subjectId],
                      currentTime
                    )
                    const locked = isSubjectLocked(subjects[subjectId])
                    if (status.status !== 'none') {
                      return (
                        <span className={`lock-time ${locked ? 'locked' : ''}`}>
                          {status.text} {formatLockTime(status.time)}{' '}
                        </span>
                      )
                    }
                    return null
                  })()}
                </>
              )}
            </h2>

            {/* if locked, show locked message */}
            {isLocked ? (
              <div className="locked-message">
                <h2>此題庫目前不開放查看</h2>
                <p>為維護考試公平性，考試期間題庫暫時關閉</p>
              </div>
            ) : (
              <>
                {/* search section */}
                <div className="search-section">
                  <input
                    type="text"
                    placeholder={getSearchPlaceholder(
                      subjects[subjectId].quizType
                    )}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                {/* questions list */}
                <div className="questions-list">
                  {getFilteredQuestions().map((question) =>
                    renderQuestionContent(question)
                  )}
                </div>
              </>
            )}

            {/* back button */}
            <button className="back-btn" onClick={handleBack}>
              返回
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default SingleBank
