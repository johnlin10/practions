import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { isSubjectLocked } from '../../Bank/utils/bankHelpers'
import { subjects } from '../../../data/subjects'
import '../History.scss'
import '../../../styles/reviewQuestions.scss'

function SingleHistory() {
  const [pageAnimation, setPageAnimation] = useState(true)
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [showWrongOnly, setShowWrongOnly] = useState(false)

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('quizHistory-v3') || '[]')
    const selectedRecord = history[id]

    if (!selectedRecord) return
    const checkLockStatus = () => {
      if (isSubjectLocked(subjects[selectedRecord.subject.id])) {
        navigate('/history')
        setTimeout(() => {
          alert('此科目目前處於鎖定狀態，無法查看歷史紀錄')
        }, 100)
        return
      }
    }
    checkLockStatus()
    const intervalId = setInterval(checkLockStatus, 5000)

    setRecord(selectedRecord)
    return () => clearInterval(intervalId)
  }, [id, navigate])

  useEffect(() => {
    setTimeout(() => {
      setPageAnimation(false)
    }, 100)
  }, [])

  // 處理關閉單個歷史紀錄頁面
  const handleClose = () => {
    setPageAnimation(true)

    setTimeout(() => {
      navigate('/history')
    }, 500)
  }

  if (!record) return null

  const analyzedQuestions = record.questions.map((question) => {
    const userAnswer = record.answers[question.id]
    const isCorrect = userAnswer === question.correctIndex
    return {
      ...question,
      userAnswer,
      isCorrect,
      isUnanswered: userAnswer === undefined,
    }
  })

  const displayQuestions = showWrongOnly
    ? analyzedQuestions.filter((q) => !q.isCorrect)
    : analyzedQuestions

  return (
    <div className={`single-history ${pageAnimation ? 'page-animation' : ''}`}>
      <div className="single-history-container review-questions-container">
        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <div className="review-questions-header">
          <h2>{record.subject.name}</h2>
          <p className="date-text">
            #
            {new Date(record.date)
              .toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
              .replace(/[/-]/g, '')
              .replace(/[\s:]/g, '')}
          </p>
        </div>

        <div className="summary">
          <h1>
            {record.correctRate}{' '}
            <span>
              {record.correctCount}/{record.questions.length}
            </span>
          </h1>
          <p>
            用時 {Math.floor(record.duration / 60000)} 分{' '}
            {Math.floor((record.duration % 60000) / 1000)} 秒
          </p>
        </div>

        <div className="filters">
          <div
            className={`filter-switch ${showWrongOnly ? 'active' : ''}`}
            onClick={() => setShowWrongOnly(!showWrongOnly)}
          >
            <span>只顯示錯誤題目</span>
          </div>
        </div>

        <div className="questions-review">
          {displayQuestions.map((question) => (
            <div
              key={question.id}
              className={`question-item ${
                question.isCorrect ? 'correct' : 'wrong'
              } ${question.isUnanswered ? 'unanswered' : ''}`}
            >
              <h3>#{question.id}</h3>
              <div
                className={`answer-status ${
                  question.isCorrect ? 'correct' : 'wrong'
                }`}
              >
                {question.isUnanswered
                  ? '未作答'
                  : question.isCorrect
                  ? '✓ 答對'
                  : `✗ 答錯 (正確答案: ${String.fromCharCode(
                      65 + question.correctIndex
                    )})`}
              </div>
              <p>{question.question}</p>
              <div className="options">
                {question.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`option 
                    ${idx === question.userAnswer ? 'user-answer' : ''} 
                    ${idx === question.correctIndex ? 'correct-answer' : ''}`}
                  >
                    {String.fromCharCode(65 + idx)}. {option}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SingleHistory
