import React, { useEffect } from 'react'
import '../styles/Quiz.scss'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuiz } from '../context/QuizContext'
import { subjects } from '../data/subjects'
import Timer from './Timer'
import { isSubjectLocked } from '../components/Bank'

function Quiz() {
  const { subjectId } = useParams()
  const navigate = useNavigate()
  const subject = subjects[subjectId] || null

  const {
    startQuiz,
    quizState,
    submitAnswer,
    finishQuiz,
    handlePrev,
    handleNext,
  } = useQuiz()
  const { questions, currentQuestionIndex, answers } = quizState

  useEffect(() => {
    if (!subject) return

    const shuffled = [...subject.questions]
      .sort(() => 0.5 - Math.random())
      .slice(0, subject.questionCount)
    startQuiz(subject, shuffled)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  // if no subjectId, show subject list
  if (!subjectId) {
    return (
      <div className="page-container">
        <h1>測驗科目</h1>
        <div className="subject-list">
          {Object.values(subjects).map((subject) => {
            if (!subject.quizOpen) return null
            return (
              <div key={subject.id} className="subject-card">
                <h3>{subject.name}</h3>
                <div className="subject-info">
                  <p>{subject.questionCount} 題</p>
                  <p>{subject.timeLimit} 分鐘</p>
                </div>
                <button
                  className="start-quiz-btn"
                  onClick={() => {
                    if (isSubjectLocked(subject)) {
                      alert('此科目目前處於鎖定狀態，無法完成測驗')
                      return
                    }
                    navigate(`/quiz/${subject.id}`)
                  }}
                >
                  開始測驗
                </button>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // handle answer
  const handleAnswer = (index) => {
    submitAnswer(questions[currentQuestionIndex].id, index)
  }

  // finish quiz
  const handleFinish = (force = false) => {
    const allAnswered = questions.every(
      (question) => answers[question.id] !== undefined
    )

    if (!allAnswered) {
      if (force) {
        // 時間到，強制完成
        finishQuiz()
        navigate('/results')
      } else {
        // 時間未到，但未完成所有題目
        alert('請回答所有問題')
        return
      }
    } else {
      // 全部題目都已作答，可以完成測驗
      finishQuiz()
      navigate('/results')
    }
  }

  return (
    <div className="page-container">
      <Timer
        duration={subject?.timeLimit}
        onTimeUp={() => handleFinish(true)}
      />

      <div className="question-section">
        <h2>
          {currentQuestionIndex + 1} / {subject.questionCount}
        </h2>
        <div className="question-block">
          <p>{questions[currentQuestionIndex]?.question}</p>
        </div>
      </div>

      <div className="quiz-button-section">
        <div className="quiz-options">
          {questions[currentQuestionIndex]?.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={
                answers[questions[currentQuestionIndex].id] === idx
                  ? 'selected'
                  : ''
              }
            >
              <span>{String.fromCharCode(65 + idx)}</span>
              {option}
            </button>
          ))}
        </div>
        <div className="quiz-buttons">
          <button onClick={handlePrev}>
            <span class="material-symbols-rounded">arrow_back</span>
          </button>
          <button onClick={handleNext}>
            <span class="material-symbols-rounded">arrow_forward</span>
          </button>
          <button
            onClick={() => {
              handleFinish()
            }}
            className="finish-button"
          >
            完成測驗
          </button>
        </div>
      </div>
    </div>
  )
}

export default Quiz
