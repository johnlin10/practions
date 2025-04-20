import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './Results.scss'
import '../../styles/reviewQuestions.scss'

// context
import { useQuiz } from '../../context/QuizContext'

function Results() {
  const navigate = useNavigate()
  // get quiz state from context
  const { quizState } = useQuiz()
  // state for showing wrong only
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  // state for sorting by question ID
  const [sortByQuestionId, setSortByQuestionId] = useState(false)
  // state for results
  const [results, setResults] = useState({
    correctCount: 0,
    wrongAnswers: [],
    allQuestions: [],
  })

  // 使用 useMemo 處理篩選和排序
  const displayQuestions = useMemo(() => {
    let filteredQuestions = showWrongOnly
      ? results.wrongAnswers
      : results.allQuestions

    // 應用排序條件
    if (sortByQuestionId) {
      return [...filteredQuestions].sort((a, b) => {
        // 嘗試提取數字部分進行排序
        const aNum = parseInt(a.id.toString().replace(/\D/g, '')) || 0
        const bNum = parseInt(b.id.toString().replace(/\D/g, '')) || 0
        return aNum - bNum
      })
    }

    return filteredQuestions
  }, [
    results.wrongAnswers,
    results.allQuestions,
    showWrongOnly,
    sortByQuestionId,
  ])

  // calculate test duration
  const duration = quizState.endTime - quizState.startTime
  // convert to minutes and seconds
  const minutes = Math.floor(duration / 60000)
  const seconds = ((duration % 60000) / 1000).toFixed(0)

  useEffect(() => {
    // if no questions, navigate to home
    if (!quizState.questions.length) {
      navigate('/')
      return
    }

    //* analyze results
    // loop through questions
    const analyzedResults = quizState.questions.map((question) => {
      const userAnswer = quizState.answers[question.id]
      const isCorrect = userAnswer === question.correctIndex
      return {
        ...question,
        userAnswer,
        isCorrect,
        isUnanswered: userAnswer === undefined,
      }
    })

    //* set results
    const correctCount = analyzedResults.filter((q) => q.isCorrect).length
    const wrongAnswers = analyzedResults.filter((q) => !q.isCorrect)

    setResults({
      correctCount,
      wrongAnswers,
      allQuestions: analyzedResults,
    })
  }, [quizState, navigate])

  const handleClose = () => {
    navigate('/quiz')
  }

  return (
    <div className="results-page">
      <div className="review-questions-container">
        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
        <div className="review-questions-header">
          <h2>測驗結果</h2>
        </div>

        <div className="summary">
          <h1>
            {quizState.correctRate}{' '}
            <span>
              {quizState.correctCount}/{quizState.questions.length}
            </span>
          </h1>
          <p>
            用時 {minutes} 分 {seconds} 秒
          </p>
        </div>

        <div className="filters">
          <div
            className={`filter-switch ${showWrongOnly ? 'active' : ''}`}
            onClick={() => setShowWrongOnly(!showWrongOnly)}
          >
            <span className="material-symbols-rounded fill">filter_list</span>
            <p>只顯示錯誤題目</p>
          </div>
          <div
            className={`filter-switch ${sortByQuestionId ? 'active' : ''}`}
            onClick={() => setSortByQuestionId(!sortByQuestionId)}
          >
            <span className="material-symbols-outlined">swap_vert</span>
            <p>依題號排序</p>
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
                {question.isUnanswered ? (
                  '未作答'
                ) : question.isCorrect ? (
                  <>
                    <span className="material-symbols-rounded fill">check</span>
                    答對
                  </>
                ) : (
                  <>
                    <span className="material-symbols-rounded fill">close</span>
                    答錯（正確答案:{' '}
                    {String.fromCharCode(65 + question.correctIndex)}）
                  </>
                )}
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

export default Results
