import React, { useEffect } from 'react'
import './Quiz.scss'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuiz } from '../../context/QuizContext'
import { subjects } from '../../data/subjects'
import Timer from '../../components/Timer/Timer'
import { isSubjectLocked } from '../Bank/utils/bankHelpers'

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

  // start quiz
  useEffect(() => {
    if (!subject) return

    // shuffle questions
    const shuffled = [...subject.questions]
      .sort(() => 0.5 - Math.random())
      .slice(0, subject.questionCount)
    // start quiz
    startQuiz(subject, shuffled)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId])

  // if (!subjectId) {
  //   return (
  //     <div className="page">
  //       <div className="page-container"></div>
  //     </div>
  //   )
  // }

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
        // time up, force finish
        finishQuiz()
        navigate('/results')
      } else {
        // time not up, but not all questions answered
        alert('請回答所有問題')
        return
      }
    } else {
      // all questions answered, can finish quiz
      finishQuiz()
      navigate('/results')
    }
  }

  return (
    <div className="page">
      <div className="page-container">
        {subjectId ? (
          // if subjectId, show quiz page
          <>
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
          </>
        ) : (
          // if no subjectId, show subject list
          <>
            <h1 className="quiz-to-history">
              測驗
              <Link to="/history" className="no-style">
                <p>紀錄</p>
                <span class="material-symbols-rounded">chevron_right</span>
              </Link>
            </h1>
            <div className="subject-list">
              {Object.values(subjects).map((subject) => {
                if (!subject.quizOpen) return null
                return (
                  <div key={subject.id} className="subject-card">
                    <p className="subject-name">{subject.name}</p>
                    <div className="subject-card-content">
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
                        <span class="material-symbols-rounded fill">
                          play_arrow
                        </span>
                        {/* 開始測驗 */}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Quiz
