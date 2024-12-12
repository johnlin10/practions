import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext'
import '../styles/Results.scss'

function Results() {
  const navigate = useNavigate()
  const { quizState } = useQuiz()
  const [showWrongOnly, setShowWrongOnly] = useState(false)
  const [results, setResults] = useState({
    correctCount: 0,
    wrongAnswers: [],
    allQuestions: [],
  })

  useEffect(() => {
    if (!quizState.questions.length) {
      navigate('/')
      return
    }

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

    const correctCount = analyzedResults.filter((q) => q.isCorrect).length
    const wrongAnswers = analyzedResults.filter((q) => !q.isCorrect)

    setResults({
      correctCount,
      wrongAnswers,
      allQuestions: analyzedResults,
    })
  }, [quizState, navigate])

  const displayQuestions = showWrongOnly
    ? results.wrongAnswers
    : results.allQuestions
  const duration = quizState.endTime - quizState.startTime
  const minutes = Math.floor(duration / 60000)
  const seconds = ((duration % 60000) / 1000).toFixed(0)

  return (
    <div className="page-container">
      <h1>測驗結果</h1>

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
        <label>
          <input
            type="checkbox"
            checked={showWrongOnly}
            onChange={(e) => setShowWrongOnly(e.target.checked)}
          />
          只顯示錯誤題目
        </label>
      </div>

      <div className="questions-review">
        {displayQuestions.map((question, index) => (
          <div
            key={question.id}
            className={`question-item ${
              question.isCorrect ? 'correct' : 'wrong'
            } ${question.isUnanswered ? 'unanswered' : ''}`}
          >
            <h3>#{question.id}</h3>
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
            <div className="answer-status">
              {question.isUnanswered
                ? '未作答'
                : question.isCorrect
                ? '✓ 答對'
                : `✗ 答錯 (正確答案: ${String.fromCharCode(
                    65 + question.correctIndex
                  )})`}
            </div>
          </div>
        ))}
      </div>

      <div className="button-section">
        <button onClick={() => navigate('/')}>返回首頁</button>
      </div>
    </div>
  )
}

export default Results
