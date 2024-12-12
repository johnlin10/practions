import React, { createContext, useContext, useState } from 'react'
import { calculateResults } from '../utils/helper'

const QuizContext = createContext()

export function QuizProvider({ children }) {
  const [quizState, setQuizState] = useState({
    questions: [],
    answers: {},
    startTime: null,
    endTime: null,
    currentQuestionIndex: 0,
  })

  const startQuiz = (subject, questions) => {
    setQuizState({
      subject,
      questions,
      answers: {},
      startTime: new Date(),
      currentQuestionIndex: 0,
    })
  }

  const submitAnswer = (questionId, answer) => {
    setQuizState((prev) => {
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: answer,
      }

      return {
        ...prev,
        answers: updatedAnswers,
        currentQuestionIndex:
          prev.currentQuestionIndex < prev.questions.length - 1
            ? prev.currentQuestionIndex + 1
            : prev.currentQuestionIndex,
      }
    })
  }

  const finishQuiz = () => {
    const endTime = new Date()
    const results = calculateResults(quizState.questions, quizState.answers)

    // 儲存到 localStorage
    const historyRecord = {
      subject: quizState.subject,
      date: endTime,
      duration: endTime - quizState.startTime,
      correctRate: results.correctRate,
      correctCount: results.correctCount,
      answers: quizState.answers,
      questions: quizState.questions,
    }

    const history = JSON.parse(localStorage.getItem('quizHistory-v3') || '[]')
    history.push(historyRecord)
    localStorage.setItem('quizHistory-v3', JSON.stringify(history))

    setQuizState((prev) => ({
      ...prev,
      endTime,
      correctRate: results.correctRate,
      correctCount: results.correctCount,
    }))
  }

  const handlePrev = () => {
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex:
        prev.currentQuestionIndex > 0
          ? prev.currentQuestionIndex - 1
          : prev.currentQuestionIndex,
    }))
  }

  const handleNext = () => {
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex:
        prev.currentQuestionIndex < prev.questions.length - 1
          ? prev.currentQuestionIndex + 1
          : prev.currentQuestionIndex,
    }))
  }

  return (
    <QuizContext.Provider
      value={{
        quizState,
        startQuiz,
        submitAnswer,
        finishQuiz,
        handlePrev,
        handleNext,
      }}
    >
      {children}
    </QuizContext.Provider>
  )
}

export const useQuiz = () => useContext(QuizContext)
