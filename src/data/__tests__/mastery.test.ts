import { collectMastery, masteryPercent } from '@/data/mastery'
import { subjects } from '@/data/subjects'
import type { HistoryRecord } from '@/types'

const accounting = subjects.accounting.questions.map((q) => q.id)
const words = subjects.pvqc_ai.questions.map((q) => q.id)

type Answer = { id: string; correct: boolean; unanswered?: boolean }

const result = ({ id, correct, unanswered }: Answer) => ({
  questionId: id,
  userAnswer: unanswered ? undefined : 0,
  correctAnswer: 0,
  isCorrect: correct,
  isUnanswered: !!unanswered,
})

const standard = (subjectId: string, date: string, answers: Answer[]) =>
  ({
    id: `${subjectId}-${date}`,
    subject: {
      id: subjectId,
      name: subjectId,
      baseQuestionType: 'single_choice',
    },
    recordType: 'standard',
    flowMode: 'standard',
    date: new Date(date),
    duration: 0,
    results: { questionResults: answers.map(result) },
  }) as unknown as HistoryRecord

const pvqc = (date: string, stages: Record<string, Answer[]>) =>
  ({
    id: `pvqc-${date}`,
    subject: { id: 'pvqc_ai', name: 'PVQC AI', baseQuestionType: 'vocabulary' },
    recordType: 'pvqc',
    flowMode: 'pvqc_custom',
    date: new Date(date),
    duration: 0,
    results: {
      stageResults: Object.entries(stages).map(([mode, answers]) => ({
        stageId: mode,
        mode,
        questionResults: answers.map(result),
      })),
    },
  }) as unknown as HistoryRecord

describe('collectMastery', () => {
  const [q1, q2, q3] = accounting

  it('連續答對兩次才算掌握，再答錯就掉回來；沒作答不算', () => {
    const history = [
      standard('accounting', '2026-10-01', [
        { id: q1, correct: true },
        { id: q2, correct: true },
        { id: q3, correct: true },
      ]),
      standard('accounting', '2026-10-02', [
        { id: q1, correct: true },
        { id: q2, correct: true },
        { id: q3, correct: false, unanswered: true },
      ]),
      standard('accounting', '2026-10-03', [{ id: q2, correct: false }]),
    ]
    const m = collectMastery(history).get('accounting')!
    expect(m.mastered).toBe(1)
    expect(m.total).toBe(accounting.length)
    expect(masteryPercent(m)).toBe(Math.floor(1000 / accounting.length) / 10)
  })

  it('沒作答過的題庫不列出', () => {
    const history = [
      standard('accounting', '2026-10-01', [
        { id: q1, correct: false, unanswered: true },
      ]),
    ]
    expect(collectMastery(history).has('accounting')).toBe(false)
    expect(collectMastery(history).has('information_security')).toBe(false)
  })

  it('舊 AIL 科目換算成目前題號', () => {
    const history = ['2026-10-01', '2026-10-02'].map((date) =>
      standard('ail_certification_exam_multiple_choice', date, [
        { id: '1', correct: true },
      ]),
    )
    expect(
      collectMastery(history).get('ail_certification_exam')?.mastered,
    ).toBe(1)
  })

  it('PVQC 依作答方式分開算，總數是字數 × 6', () => {
    const [w1] = words
    const history = [
      pvqc('2026-10-01', {
        pvqc_write: [{ id: w1, correct: true }],
        pvqc_read: [{ id: w1, correct: true }],
      }),
      pvqc('2026-10-02', { pvqc_write: [{ id: w1, correct: true }] }),
    ]
    const m = collectMastery(history).get('pvqc_ai')!
    expect(m.total).toBe(words.length * 6)
    expect(m.mastered).toBe(1)
    const byMode = Object.fromEntries(m.modes.map((x) => [x.mode, x]))
    expect(byMode.pvqc_write).toMatchObject({ mastered: 1, practiced: true })
    expect(byMode.pvqc_read).toMatchObject({ mastered: 0, practiced: true })
    expect(byMode.pvqc_listen_english.practiced).toBe(false)
  })

  it('百分比無條件捨去，0–1% 與 99–100% 取到小數一位', () => {
    const percent = (mastered: number, total: number) =>
      masteryPercent({ mastered, total, modes: [] })
    expect(percent(0, 0)).toBe(0)
    expect(percent(0, 200)).toBe(0)
    expect(percent(1, 1362)).toBe(0) // 0.07% → 0%
    expect(percent(6, 1362)).toBe(0.4)
    expect(percent(3, 200)).toBe(1)
    expect(percent(57, 200)).toBe(28)
    expect(percent(199, 200)).toBe(99.5)
    expect(percent(1361, 1362)).toBe(99.9)
    expect(percent(200, 200)).toBe(100)
  })
})
