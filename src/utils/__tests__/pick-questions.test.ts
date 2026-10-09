import { pickQuestions } from '../pick-questions'
import { subjects } from '@/data/subjects'
import type { Question } from '@/types/questions'

const ail = subjects.ail_certification_exam
const stage = ail.flowConfig.stages[0]
const countByType = (list: Question[]) =>
  list.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1
    return acc
  }, {})

describe('pickQuestions', () => {
  it('AIL 依出題組成抽 50 題：單選 35、多選 10、是非 5，不重複', () => {
    const picked = pickQuestions(ail.questions, stage)
    expect(picked).toHaveLength(50)
    expect(new Set(picked.map((q) => q.id)).size).toBe(50)
    expect(countByType(picked)).toEqual({
      single_choice: 35,
      multiple_choice: 10,
      true_false: 5,
    })
  })

  it('某題型不夠時，從其他題目補滿題數', () => {
    const fewTrueFalse = ail.questions.filter(
      (q) => q.type !== 'true_false' || q.id === '301',
    )
    const picked = pickQuestions(fewTrueFalse, stage)
    expect(picked).toHaveLength(50)
    expect(countByType(picked).true_false).toBe(1)
  })

  it('沒有出題組成時照題數隨機抽', () => {
    const questions = subjects.accounting.questions
    expect(pickQuestions(questions, { questionCount: 10 })).toHaveLength(10)
  })
})
