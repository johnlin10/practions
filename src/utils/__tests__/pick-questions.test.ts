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

  it('約 20% 隨機、10% 已掌握，其餘優先從還沒掌握的題目抽，不重複', () => {
    const questions = subjects.accounting.questions
    const count = { questionCount: 40 } // 隨機 8 題、已掌握 4 題
    const many = new Set(questions.slice(40).map((q) => q.id))
    for (let i = 0; i < 20; i++) {
      // 還沒掌握的很多時，已掌握的至少 4 題，最多再加隨機的 8 題
      const picked = pickQuestions(questions, count, many)
      expect(new Set(picked).size).toBe(40)
      const n = picked.filter((q) => many.has(q.id)).length
      expect(n).toBeGreaterThanOrEqual(4)
      expect(n).toBeLessThanOrEqual(12)
    }

    // 只剩 20 題還沒掌握：全部抽到，其餘由已掌握的補滿
    const most = new Set(questions.slice(20).map((q) => q.id))
    const picked = pickQuestions(questions, count, most)
    expect(picked).toHaveLength(40)
    expect(picked.filter((q) => !most.has(q.id))).toHaveLength(20)

    // 已掌握的只有 2 題：兩題都抽到，不夠的由還沒掌握的補滿
    const few = new Set(questions.slice(0, 2).map((q) => q.id))
    const picked2 = pickQuestions(questions, count, few)
    expect(picked2).toHaveLength(40)
    expect(picked2.filter((q) => few.has(q.id))).toHaveLength(2)
  })

  it('有出題組成時，各題型的題數不變，題型內優先抽還沒掌握的', () => {
    const single = ail.questions.filter((q) => q.type === 'single_choice')
    // 單選只有 15 題還沒掌握：隨機 10 題與已掌握 5 題最多佔 15 個單選名額，剩下 20 個一定裝得下這 15 題
    const unmastered = single.slice(0, 15)
    const mastered = new Set(single.slice(15).map((q) => q.id))
    const picked = pickQuestions(ail.questions, stage, mastered)
    expect(countByType(picked)).toEqual({
      single_choice: 35,
      multiple_choice: 10,
      true_false: 5,
    })
    expect(unmastered.every((q) => picked.includes(q))).toBe(true)
  })

  it('沒有出題組成時照題數隨機抽', () => {
    const questions = subjects.accounting.questions
    expect(pickQuestions(questions, { questionCount: 10 })).toHaveLength(10)
  })
})
