import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { isSubjectLocked } from '../Bank/utils/bankHelpers'
import { subjects } from '../../data/subjects'

function History() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [record, setRecord] = useState(null)
  const [showWrongOnly, setShowWrongOnly] = useState(false)

  // const [pageAnimation, setPageAnimation] = useState(false)
  // useEffect(() => {
  //   setTimeout(() => {
  //     setPageAnimation(true)
  //   }, 100)
  // }, [])

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem('quizHistory-v3') || '[]'
    )
    setHistory(savedHistory.reverse())
    console.log(savedHistory)
  }, [])

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

  if (!id) {
    return (
      <div className="page">
        <div className="page-container">
          <h1>
            <Link className="pre-path no-style" to="/quiz">
              測驗科目 /
            </Link>{' '}
            歷史紀錄
          </h1>
          <div className="history-list">
            {history.length > 0 && (
              <div className="history-section">
                {history.map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-info">
                      <h3>
                        {record.subject.name
                          ? record.subject.name
                          : `第 ${history.length - index} 次`}
                      </h3>
                      <p>
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
                      <p className="correct-rate">{record.correctRate}</p>
                      {/* <p>
                      {Math.floor(record.duration / 60000) > 0
                        ? `${Math.floor(record.duration / 60000)} 分鐘`
                        : `${Math.floor(record.duration / 1000)} 秒`}
                    </p> */}
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/history/${history.length - index - 1}`)
                      }
                    >
                      查看
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
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
    <div className={`page history`}>
      <div className="page-container">
        <h1>{record.subject.name}</h1>
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

        <div className="button-section">
          <button onClick={() => navigate('/history')}>返回</button>
        </div>
      </div>
    </div>
  )
}

export default History
