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

  it('約 80% 從還沒掌握的題目抽，其餘從整個題庫隨機抽', () => {
    const questions = subjects.accounting.questions
    // 只剩 20 題還沒掌握
    const mastered = new Set(questions.slice(20).map((q) => q.id))
    const picked = pickQuestions(questions, { questionCount: 25 }, mastered)
    expect(picked).toHaveLength(25)
    // 還沒掌握的 20 題全部抽到，隨機的 5 題剛好也可能是其中幾題
    expect(picked.filter((q) => !mastered.has(q.id))).toHaveLength(20)

    // 還沒掌握的很多時，已掌握的最多只佔隨機的那 5 題
    const few = new Set(questions.slice(0, 10).map((q) => q.id))
    const picked2 = pickQuestions(questions, { questionCount: 25 }, few)
    expect(picked2.filter((q) => few.has(q.id)).length).toBeLessThanOrEqual(5)
  })

  it('有出題組成時，各題型的題數不變，題型內優先抽還沒掌握的', () => {
    const single = ail.questions.filter((q) => q.type === 'single_choice')
    // 單選只有 20 題還沒掌握：隨機的 10 題最多佔 10 個單選名額，剩下 25 個一定裝得下這 20 題
    const unmastered = single.slice(0, 20)
    const mastered = new Set(single.slice(20).map((q) => q.id))
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
