import React from 'react'
import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { QuizProvider, useQuiz } from '@/context/QuizContext'
import { buildPracticeFlow } from '@/data/practice'
import { subjects } from '@/data/subjects'
import { QUIZ_MODES } from '@/types/quiz-modes'
import { generateDetailedResults } from '@/utils/detailed-results'

const audio = (mode: keyof typeof QUIZ_MODES) => QUIZ_MODES[mode].requiresAudio

describe('skipListening（隨手練「現在不做聽力題」）', () => {
  it('剩下的聽力題換成不用聽的題目，總題數不變，跳過的不計分', () => {
    const subject = subjects.pvqc_ai
    const { result } = renderHook(() => useQuiz(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <QuizProvider>{children}</QuizProvider>
      ),
    })
    act(() =>
      result.current.startQuiz({
        ...subject,
        flowConfig: buildPracticeFlow(subject, 20, false),
      }),
    )
    // 先答兩題（不管對錯），再跳過
    for (let i = 0; i < 2; i++) {
      act(() => {
        const { currentQuestions, currentQuestionIndex } =
          result.current.quizState
        result.current.submitAnswer(currentQuestions[currentQuestionIndex].id, '?')
        result.current.checkAnswer()
      })
      act(() => void result.current.continueFeedback())
    }
    let outcome = ''
    act(() => void (outcome = result.current.skipListening()))
    expect(outcome).toBe('continue')

    const state = result.current.quizState
    expect(state.currentQuestions).toHaveLength(20)
    // 從目前這題起都不用聽
    state.sequenceStages!.slice(2).forEach((stage) =>
      expect(audio(stage.mode)).toBe(false),
    )
    // 各階段的題目加起來還是 20 題，階段的題數跟著改
    const stageTotal = state.flowConfig.stages.reduce(
      (sum, stage) => sum + state.allStagesQuestions[stage.stageId].length,
      0,
    )
    expect(stageTotal).toBe(20)
    state.flowConfig.stages.forEach((stage) =>
      expect(stage.questionCount).toBe(
        state.allStagesQuestions[stage.stageId].length,
      ),
    )
    // 同一個作答方式不會重複出同一題
    state.flowConfig.stages.forEach((stage) => {
      const ids = state.allStagesQuestions[stage.stageId].map((q) => q.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
    expect(generateDetailedResults(state).totalQuestions).toBe(20)
  })
})
