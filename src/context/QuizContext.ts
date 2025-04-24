import React, { createContext, useContext, useState, ReactNode } from 'react'
import { calculateResults } from '../utils/helper'

interface QuizState {
  subject?: any
  questions: any[]
  answers: Record<
    string,
    {
      answeredIndex: number
      questionIndex: number
      timestamp: Date
    }
  >
  startTime: Date | null
  endTime: Date | null
  currentQuestionIndex: number
  correctRate?: string
  correctCount?: number
}

interface QuizContextType {
  quizState: QuizState
  startQuiz: (subject: any, questions: any[]) => void
  submitAnswer: (questionId: string, answer: number) => void
  finishQuiz: () => void
  handlePrev: () => void
  handleNext: (targetIndex?: number) => void
}

const QuizContext = createContext<QuizContextType | undefined>(undefined)

interface QuizProviderProps {
  children: ReactNode
}

export function QuizProvider({ children }: QuizProviderProps): JSX.Element {
  const [quizState, setQuizState] = useState<QuizState>({
    questions: [],
    answers: {},
    startTime: null,
    endTime: null,
    currentQuestionIndex: 0,
  })

  const startQuiz = (subject: any, questions: any[]) => {
    setQuizState({
      subject,
      questions,
      answers: {},
      startTime: new Date(),
      endTime: null,
      currentQuestionIndex: 0,
    })
  }

  const submitAnswer = (questionId: string, answer: number) => {
    setQuizState((prev) => {
      const currentQuestion = prev.questions.findIndex(
        (q) => q.id === questionId
      )
      const updatedAnswers = {
        ...prev.answers,
        [questionId]: {
          answeredIndex: answer,
          questionIndex: currentQuestion,
          timestamp: new Date(),
        },
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
      duration: quizState.startTime
        ? endTime.getTime() - quizState.startTime.getTime()
        : 0,
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

  const handleNext = (targetIndex?: number) => {
    setQuizState((prev) => {
      if (typeof targetIndex === 'number') {
        // 如果提供了目標索引，直接跳轉到該索引
        return {
          ...prev,
          currentQuestionIndex: Math.min(
            Math.max(0, targetIndex),
            prev.questions.length - 1
          ),
        }
      }

      // 否則按照原邏輯進行下一題
      return {
        ...prev,
        currentQuestionIndex:
          prev.currentQuestionIndex < prev.questions.length - 1
            ? prev.currentQuestionIndex + 1
            : prev.currentQuestionIndex,
      }
    })
  }

  const contextValue: QuizContextType = {
    quizState,
    startQuiz,
    submitAnswer,
    finishQuiz,
    handlePrev,
    handleNext,
  }

  return React.createElement(
    QuizContext.Provider,
    { value: contextValue },
    children
  )
}

export const useQuiz = (): QuizContextType => {
  const context = useContext(QuizContext)
  if (context === undefined) {
    throw new Error('useQuiz 必須在 QuizProvider 內使用')
  }
  return context
}
