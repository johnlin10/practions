import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../Bank.scss'

// utils
import {
  isSubjectLocked,
  getLockStatus,
  getSearchPlaceholder,
  formatLockTime,
} from '../utils/bankHelpers'

// types
import {
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  VocabularyQuestion,
} from '../../../types/questions'
import { SubjectConfig } from '../../../types/quiz-flows'

// data
import { subjects } from '../../../data/subjects'

// interfaces
interface SingleBankParams extends Record<string, string | undefined> {
  subjectId?: string
}

/**
 * [page] SingleBank page
 * 單一科目的題庫詳細頁面，顯示該科目的所有題目
 */
const SingleBank: React.FC = () => {
  // 頁面載入動畫
  const [pageAnimation, setPageAnimation] = useState<boolean>(true)
  // 取得科目 ID
  const { subjectId } = useParams<SingleBankParams>()
  // 導航
  const navigate = useNavigate()
  // 搜尋關鍵字
  const [searchTerm, setSearchTerm] = useState<string>('')
  // 是否鎖定
  const [isLocked, setIsLocked] = useState<boolean>(false)
  // 當前時間
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // 頁面載入動畫
  useEffect(() => {
    setTimeout(() => {
      setPageAnimation(false)
    }, 100)
  }, [])

  // 更新當前時間
  useEffect(() => {
    setCurrentTime(new Date())

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  /**
   * [function] renderQuestionContent
   * 渲染題目內容
   * @param {Question} question - 題目
   * @returns {React.ReactNode} - 渲染題目內容
   */
  const renderQuestionContent = (question: Question): React.ReactNode => {
    // 如果科目 ID 不存在，則返回 null
    if (!subjectId) return null

    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目不存在，則返回 null
    if (!subject) return null

    // 根據不同題型渲染不同格式
    switch (question.type) {
      case 'single_choice':
        return renderSingleChoice(question as SingleChoiceQuestion)
      case 'multiple_choice':
        return renderMultipleChoice(question as MultipleChoiceQuestion)
      case 'true_false':
        return renderTrueFalse(question as TrueFalseQuestion)
      case 'vocabulary':
        return renderVocabulary(question as VocabularyQuestion)
      default:
        return null
    }
  }

  /**
   * [function] renderSingleChoice
   * 渲染單選題
   * @param {SingleChoiceQuestion} question - 單選題
   * @returns {React.ReactNode} - 渲染單選題
   */
  const renderSingleChoice = (
    question: SingleChoiceQuestion
  ): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header">
          <span className="question-number">#{question.id}</span>
          <p className="question-text">{question.question}</p>
        </div>
        <div className="options">
          {question.options.map((option, idx) => (
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
  }

  /**
   * [function] renderMultipleChoice
   * 渲染多選題
   * @param {MultipleChoiceQuestion} question - 多選題
   * @returns {React.ReactNode} - 渲染多選題
   */
  const renderMultipleChoice = (
    question: MultipleChoiceQuestion
  ): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header">
          <span className="question-number">#{question.id}</span>
          <p className="question-text">{question.question}</p>
        </div>
        <div className="options">
          {question.options.map((option, idx) => (
            <div
              key={idx}
              className={`option ${
                question.correctIndexes.includes(idx) ? 'correct-answer' : ''
              }`}
            >
              {String.fromCharCode(65 + idx)}. {option}
            </div>
          ))}
        </div>
        <div className="answer-info">
          <span className="answer-label">正確答案：</span>
          <span className="answer">
            {question.correctIndexes
              .map((idx) => String.fromCharCode(65 + idx))
              .join(', ')}
          </span>
        </div>
      </div>
    )
  }

  /**
   * [function] renderTrueFalse
   * 渲染是非題
   * @param {TrueFalseQuestion} question - 是非題
   * @returns {React.ReactNode} - 渲染是非題
   */
  const renderTrueFalse = (question: TrueFalseQuestion): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header true-false">
          <span className="question-number">#{question.id}</span>
          {question.correctAnswer ? (
            <span className="true-answer">O</span>
          ) : (
            <span className="false-answer">X</span>
          )}
          <p className="question-text">{question.question}</p>
        </div>
      </div>
    )
  }

  /**
   * [function] renderVocabulary
   * 渲染單字題
   * @param {VocabularyQuestion} question - 單字題
   * @returns {React.ReactNode} - 渲染單字題
   */
  const renderVocabulary = (question: VocabularyQuestion): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="vocabulary-content" onClick={() => playWord(question)}>
          <div className="word">
            <span className="english">{question.english}</span>
            <span className="chinese">{question.chinese}</span>
          </div>
          <div className="volume-up">
            <span className="material-symbols-rounded">volume_up</span>
          </div>
        </div>
      </div>
    )
  }

  /**
   * [function] playWord
   * 使用 Web Speech API 播放單字
   * @param {VocabularyQuestion} question - 單字題
   * @returns {void}
   */
  const playWord = (question: VocabularyQuestion): void => {
    if (question.english) {
      const english = new SpeechSynthesisUtterance(question.english)
      window.speechSynthesis.speak(english)
    }
  }

  /**
   * [function] getFilteredQuestions
   * 過濾題目
   * @returns {Question[]} - 過濾後的題目
   */
  const getFilteredQuestions = (): Question[] => {
    // 如果科目 ID 不存在或被鎖定，則返回空陣列
    if (!subjectId || isLocked) return []

    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目不存在，則返回空陣列
    if (!subject) return []

    // 取得科目題目
    const currentQuestions = subject.questions
    // 如果沒有搜尋關鍵字，則返回科目題目
    if (!searchTerm) return currentQuestions

    // 通用的 ID 搜尋邏輯
    if (searchTerm.startsWith('#')) {
      // 取得搜尋 ID
      const idSearch = searchTerm.slice(1)
      // 返回搜尋 ID 的題目
      return currentQuestions.filter((q) => q.id?.toString() === idSearch)
    }

    // 根據不同題型進行搜尋
    // 如果搜尋關鍵字包含題目或選項，則返回該題目
    return currentQuestions.filter((question) => {
      switch (question.type) {
        case 'single_choice':
        case 'multiple_choice':
          return (
            question.question
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            question.options?.some((option) =>
              option.toLowerCase().includes(searchTerm.toLowerCase())
            )
          )

        case 'true_false':
          return question.question
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())

        case 'vocabulary':
          return (
            question.english
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            question.chinese?.includes(searchTerm)
          )

        default:
          return false
      }
    })
  }

  //* 檢查鎖定狀態
  useEffect(() => {
    // 如果科目 ID 不存在，則設定為未鎖定
    if (!subjectId) {
      setIsLocked(false)
      return
    }
    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目存在，則檢查鎖定狀態
    if (subject) {
      setIsLocked(isSubjectLocked(subject))
    }
  }, [subjectId])

  /**
   * [function] checkLockStatus
   * 檢查鎖定狀態
   * @returns {void}
   */
  const checkLockStatus = useCallback(() => {
    if (!subjectId) {
      setIsLocked(false)
      return
    }

    const subject = subjects[subjectId]
    if (subject) {
      setIsLocked(isSubjectLocked(subject))
    }
  }, [subjectId])

  // 每 10 秒檢查一次鎖定狀態
  useEffect(() => {
    // 檢查鎖定狀態
    checkLockStatus()

    // 每 10 秒檢查一次鎖定狀態
    const intervalId = setInterval(() => {
      checkLockStatus()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [subjectId, checkLockStatus])

  /**
   * [function] handleClose
   * 處理關閉單一題庫頁面
   * @returns {void}
   */
  const handleClose = (): void => {
    // 設定頁面動畫
    setPageAnimation(true)
    // 延遲 500 毫秒退出動畫後，跳轉到題庫列表
    setTimeout(() => {
      navigate('/bank')
    }, 500)
  }

  // 如果科目 ID 不存在，則顯示錯誤訊息
  if (!subjectId) {
    return (
      <div className="single-bank">
        <div className="single-bank-container">
          <div className="error-message">
            <h2>找不到指定的題庫</h2>
            <button onClick={() => navigate('/bank')}>返回題庫列表</button>
          </div>
        </div>
      </div>
    )
  }

  // 取得科目
  const subject: SubjectConfig = subjects[subjectId]
  // 如果科目不存在，則顯示錯誤訊息
  if (!subject) {
    return (
      <div className="single-bank">
        <div className="single-bank-container">
          <div className="error-message">
            <h2>找不到指定的題庫</h2>
            <button onClick={() => navigate('/bank')}>返回題庫列表</button>
          </div>
        </div>
      </div>
    )
  }

  // 渲染單一題庫頁面
  return (
    <div className={`single-bank ${pageAnimation ? 'page-animation' : ''}`}>
      <div className="single-bank-container">
        <h2>
          {subject.name}
          {subject.lockTime && (
            <>
              {(() => {
                const status = getLockStatus(subject, currentTime)
                const locked = isSubjectLocked(subject)
                if (status.status !== 'none' && status.time) {
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

        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        {/* 如果被鎖定，顯示鎖定訊息 */}
        {isLocked ? (
          <div className="locked-message">
            <h2>此題庫目前不開放查看</h2>
            <p>為維護考試公平性，考試期間題庫暫時關閉</p>
          </div>
        ) : (
          <>
            {/* 搜尋區域 */}
            <div className="search-section">
              <input
                type="text"
                placeholder={getSearchPlaceholder(subject.baseQuestionType)}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* 題目列表 */}
            <div className="questions-list">
              {getFilteredQuestions().map((question) =>
                renderQuestionContent(question)
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SingleBank
