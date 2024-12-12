import '../styles/Bank.scss'
import { useEffect, useState } from 'react'
import { subjects } from '../data/subjects'
import { useParams, useNavigate, Link } from 'react-router-dom'

export const isSubjectLocked = (subject) => {
  if (!subject?.lockTime) return false

  const [startTime, endTime] = subject.lockTime
  const now = new Date()
  const examStart = new Date(startTime)
  const examEnd = new Date(endTime)

  return now >= examStart && now <= examEnd
}

function Bank() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setCurrentTime(new Date())

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId)
    }
  }, [subjectId])

  // 渲染題目內容
  const renderQuestionContent = (question) => {
    // 根據不同題型渲染不同格式
    if (subjects[selectedSubject].quizType === 'once_choice') {
      return (
        <>
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
        </>
      )
    } else if (subjects[selectedSubject].quizType === 'vocabulary') {
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

  const getFilteredQuestions = () => {
    if (!selectedSubject || isLocked) return []

    const currentQuestions = subjects[selectedSubject].questions

    if (!searchTerm) return currentQuestions

    if (subjects[selectedSubject].quizType === 'once_choice') {
      if (searchTerm.startsWith('#')) {
        const idSearch = searchTerm.slice(1)
        return currentQuestions.filter((q) => q.id.toString() === idSearch)
      }
      return currentQuestions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.options.some((option) =>
            option.toLowerCase().includes(searchTerm.toLowerCase())
          )
      )
    } else if (subjects[selectedSubject].quizType === 'vocabulary') {
      return currentQuestions.filter(
        (word) =>
          word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
          word.chinese.includes(searchTerm)
      )
    }
    return currentQuestions
  }

  useEffect(() => {
    if (!selectedSubject) {
      setIsLocked(false)
      return
    }

    setIsLocked(isSubjectLocked(subjects[selectedSubject]))
  }, [selectedSubject])

  useEffect(() => {
    // 立即檢查一次鎖定狀態
    checkLockStatus()

    // 設定每10秒檢查一次
    const intervalId = setInterval(() => {
      checkLockStatus()
    }, 10000) // 10000 毫秒 = 10 秒

    // 清理函數：組件卸載時清除定時器
    return () => clearInterval(intervalId)
  }, [selectedSubject]) // 當選中的科目改變時重新設定定時器

  const checkLockStatus = () => {
    if (!selectedSubject) {
      setIsLocked(false)
      return
    }

    setIsLocked(isSubjectLocked(subjects[selectedSubject]))
  }

  const getLockStatus = (subject) => {
    if (!subject?.lockTime) return { status: 'none' }

    const [startTime, endTime] = subject.lockTime
    const examStart = new Date(startTime)
    const examEnd = new Date(endTime)

    if (currentTime < examStart) {
      return {
        status: 'upcoming',
        time: startTime,
        text: '即將鎖定',
      }
    } else if (currentTime >= examStart && currentTime <= examEnd) {
      return {
        status: 'locked',
        time: endTime,
        text: '鎖定到 ',
      }
    } else {
      return { status: 'none' }
    }
  }

  const handleBack = () => {
    setSearchTerm('')
    setSelectedSubject(null)
    navigate('/bank')
  }

  const handleSubjectSelect = (subjectId) => {
    navigate(`/bank/${subjectId}`)
  }

  return (
    <div className="page-container">
      <div className="subjects-section">
        <h1>題庫</h1>
        <div className="subjects-grid">
          {Object.values(subjects).map((subject) => {
            const locked = isSubjectLocked(subject)
            const lockStatus = getLockStatus(subject)
            return (
              <Link
                key={subject.id}
                className={`subject-card no-style${
                  selectedSubject === subject.id ? ' selected' : ''
                }${locked ? ' locked' : ''}`}
                to={locked ? '' : `/bank/${subject.id}`}
              >
                <h3>
                  {locked && (
                    <span className="material-symbols-rounded">lock</span>
                  )}
                  {subject.name}
                </h3>

                <p>
                  {subject.lockTime && lockStatus.status !== 'none' && (
                    <span className={`lock-time ${locked ? 'locked' : ''}`}>
                      {lockStatus.text}{' '}
                      {new Date(lockStatus.time)
                        .toLocaleString('zh-TW', {
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                        .replace(/\//g, '.')}{' '}
                    </span>
                  )}
                  {subject.questions.length} 題
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      <div
        className={`question-bank-container ${selectedSubject ? '' : 'hidden'}`}
      >
        {selectedSubject && (
          <>
            <button className="back-btn" onClick={handleBack}>
              返回
            </button>
            <h2>
              {subjects[selectedSubject].name}
              {subjects[selectedSubject].lockTime && (
                <>
                  {(() => {
                    const status = getLockStatus(subjects[selectedSubject])
                    const locked = isSubjectLocked(subjects[selectedSubject])
                    if (status.status !== 'none') {
                      return (
                        <span className={`lock-time ${locked ? 'locked' : ''}`}>
                          {status.text}{' '}
                          {new Date(status.time)
                            .toLocaleString('zh-TW', {
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })
                            .replace(/\//g, '.')}{' '}
                        </span>
                      )
                    }
                    return null
                  })()}
                </>
              )}
            </h2>

            {isLocked ? (
              <div className="locked-message">
                <h2>此題庫目前不開放查看</h2>
                <p>為維護考試公平性，考試期間題庫暫時關閉</p>
              </div>
            ) : (
              <>
                <div className="search-section">
                  <input
                    type="text"
                    placeholder={
                      subjects[selectedSubject].quizType === 'once_choice'
                        ? '搜尋題目、選項或 # 開頭搜尋題號'
                        : '搜尋英文或中文...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="questions-list">
                  {getFilteredQuestions().map((question, index) =>
                    renderQuestionContent(question)
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
export default Bank
