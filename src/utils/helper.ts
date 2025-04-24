interface CalculateResultsReturn {
  correctCount: number
  correctRate: string
}

interface Answer {
  answeredIndex: number
  questionIndex: number
  timestamp: Date
}

export const calculateResults = (
  questions: any[],
  answers: Record<string, Answer>
): CalculateResultsReturn => {
  let correctCount = 0

  questions.forEach((question) => {
    if (answers[question.id]?.answeredIndex === question.correctIndex) {
      correctCount++
    }
  })

  return {
    correctCount,
    correctRate: ((correctCount / questions.length) * 100).toFixed(0),
  }
}

export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
