import {
  buildReviewFlow,
  collectWrongQuestions,
  countByKind,
  reviewSummary,
} from '@/data/wrongQuestions'
import { subjects } from '@/data/subjects'
import type { HistoryRecord } from '@/types'

const accounting = subjects.accounting.questions
const ail = subjects.ail_certification_exam.questions
const vocab = subjects.pvqc_ai.questions

type Answer = { id: string; correct: boolean; unanswered?: boolean }

const result = ({ id, correct, unanswered }: Answer) => ({
  questionId: id,
  userAnswer: unanswered ? undefined : 0,
  correctAnswer: 0,
  isCorrect: correct,
  isUnanswered: !!unanswered,
})

// 標準測驗紀錄
const standard = (
  subjectId: string,
  date: string,
  answers: Answer[],
  flowMode: HistoryRecord['flowMode'] = 'standard',
): HistoryRecord =>
  ({
    id: `${subjectId}-${date}`,
    subject: { id: subjectId, name: subjectId, baseQuestionType: 'single_choice' },
    recordType: 'standard',
    flowMode,
    date: new Date(date),
    duration: 0,
    results: {
      totalCorrect: 0,
      totalQuestions: answers.length,
      overallCorrectRate: '0%',
      questionResults: answers.map(result),
    },
  }) as unknown as HistoryRecord

// PVQC 紀錄：每個階段一種作答方式
const pvqc = (date: string, stages: Record<string, Answer[]>): HistoryRecord =>
  ({
    id: `pvqc-${date}`,
    subject: { id: 'pvqc_ai', name: 'PVQC AI', baseQuestionType: 'vocabulary' },
    recordType: 'pvqc',
    flowMode: 'pvqc_custom',
    date: new Date(date),
    duration: 0,
    results: {
      totalCorrect: 0,
      totalQuestions: 0,
      overallCorrectRate: '0%',
      stageResults: Object.entries(stages).map(([mode, answers]) => ({
        stageId: mode,
        mode,
        correctCount: 0,
        totalCount: answers.length,
        correctRate: '0%',
        questionResults: answers.map(result),
      })),
    },
  }) as unknown as HistoryRecord

const ids = (history: HistoryRecord[], subjectId: string) =>
  collectWrongQuestions(history)
    .find((group) => group.subject.id === subjectId)
    ?.items.map((item) => item.question.id) ?? []

describe('collectWrongQuestions', () => {
  const [q1, q2, q3] = accounting.map((q) => q.id)

  it('答錯列入，沒作答不算，答對過的題目不列入', () => {
    const history = [
      standard('accounting', '2026-10-01', [
        { id: q1, correct: false },
        { id: q2, correct: false, unanswered: true },
        { id: q3, correct: true },
      ]),
    ]
    expect(ids(history, 'accounting')).toEqual([q1])
  })

  it('連續答對 2 次才移出，中間又答錯就重新計算（含複習紀錄）', () => {
    const wrong = standard('accounting', '2026-10-01', [{ id: q1, correct: false }])
    const right1 = standard('accounting', '2026-10-02', [{ id: q1, correct: true }], 'review')
    const wrongAgain = standard('accounting', '2026-10-03', [{ id: q1, correct: false }])
    const right2 = standard('accounting', '2026-10-04', [{ id: q1, correct: true }], 'review')
    const right3 = standard('accounting', '2026-10-05', [{ id: q1, correct: true }])

    expect(ids([wrong, right1], 'accounting')).toEqual([q1])
    expect(ids([wrong, right1, wrongAgain, right2], 'accounting')).toEqual([q1])
    expect(ids([wrong, right1, wrongAgain, right2, right3], 'accounting')).toEqual([])
    // 依日期排序，不受陣列順序影響
    expect(ids([right3, right2, wrongAgain, right1, wrong], 'accounting')).toEqual([])
  })

  it('錯最多次的排前面，同樣次數時最近答錯的在前', () => {
    const history = [
      standard('accounting', '2026-10-01', [
        { id: q1, correct: false },
        { id: q2, correct: false },
      ]),
      standard('accounting', '2026-10-02', [
        { id: q2, correct: false },
        { id: q3, correct: false },
      ]),
    ]
    expect(ids(history, 'accounting')).toEqual([q2, q3, q1])
  })

  it('PVQC 同一個單字在不同作答方式分開計算', () => {
    const word = vocab[0].id
    const history = [
      pvqc('2026-10-01', {
        pvqc_write: [{ id: word, correct: false }],
        pvqc_read: [{ id: word, correct: true }],
      }),
    ]
    const group = collectWrongQuestions(history)[0]
    expect(group.items.map((item) => item.mode)).toEqual(['pvqc_write'])
  })

  it('合併前的 AIL 紀錄對應到合併後的科目與題號', () => {
    const history = [
      standard('ail_certification_exam_multiple_choice', '2026-10-01', [
        { id: '5', correct: false },
      ]),
      standard('ail_certification_exam', '2026-10-02', [{ id: '301', correct: false }]),
    ]
    expect(ids(history, 'ail_certification_exam').sort()).toEqual(['205', '301'])
    expect(ail.some((q) => q.id === '205')).toBe(true)
  })

  it('「再練一次」答對算一次答對，接在同一筆紀錄的第一輪後面', () => {
    const review = standard('accounting', '2026-10-01', [{ id: q1, correct: false }], 'review')
    review.results.retryResults = [
      { questionId: q1, mode: 'standard', userAnswer: 0, isCorrect: true },
    ]
    const later = standard('accounting', '2026-10-02', [{ id: q1, correct: true }])

    expect(ids([review], 'accounting')).toEqual([q1])
    expect(ids([review, later], 'accounting')).toEqual([])
    // 再練又錯：維持錯題
    review.results.retryResults[0].isCorrect = false
    expect(ids([review, later], 'accounting')).toEqual([q1])
  })

  it('格式不對的「再練一次」結果略過，不影響錯題與結算', () => {
    const review = standard('accounting', '2026-10-01', [{ id: q1, correct: false }], 'review')
    const broken = (retryResults: unknown) => {
      ;(review.results as unknown as { retryResults: unknown }).retryResults = retryResults
      return review
    }
    for (const value of [
      'oops',
      { questionId: q1 },
      [null, { questionId: q1, mode: 'unknown', isCorrect: true }, { questionId: q1, mode: 'standard' }],
    ]) {
      expect(ids([broken(value)], 'accounting')).toEqual([q1])
      expect(reviewSummary(broken(value))).toEqual({ first: 0, retry: 0, remaining: 1, total: 1 })
    }
  })

  it('v3.6 以前的複習紀錄（沒有再練結果）照第一輪結算', () => {
    const review = standard('accounting', '2026-10-01', [{ id: q1, correct: true }, { id: q2, correct: false }], 'review')
    expect(reviewSummary(review)).toEqual({ first: 1, retry: 0, remaining: 1, total: 2 })
  })

  it('題庫已刪除的題目不列出', () => {
    const history = [
      standard('accounting', '2026-10-01', [{ id: 'deleted-id', correct: false }]),
    ]
    expect(collectWrongQuestions(history)).toEqual([])
  })
})

describe('buildReviewFlow', () => {
  it('依題型輪流取題：某個題型錯得特別多次，也不會只抽到那個題型', () => {
    const words = vocab.slice(0, 10).map((q) => q.id)
    const wrongRead = (date: string) =>
      pvqc(date, { pvqc_read: words.map((id) => ({ id, correct: false })) })
    const history = [
      wrongRead('2026-10-01'),
      wrongRead('2026-10-02'),
      wrongRead('2026-10-03'),
      pvqc('2026-10-04', {
        pvqc_write: words.slice(0, 2).map((id) => ({ id, correct: false })),
      }),
    ]
    const flow = buildReviewFlow(collectWrongQuestions(history)[0], 5)
    expect(
      flow.stages.map((s) => [s.mode, s.questionCount]),
    ).toEqual([
      ['pvqc_write', 2],
      ['pvqc_read', 3],
    ])
  })


  it('最多 15 題、不計時，PVQC 依作答方式分成多個階段', () => {
    const words = vocab.slice(0, 20).map((q) => q.id)
    const history = [
      pvqc('2026-10-01', {
        pvqc_write: words.slice(0, 12).map((id) => ({ id, correct: false })),
        pvqc_read: words.slice(12).map((id) => ({ id, correct: false })),
      }),
    ]
    const flow = buildReviewFlow(collectWrongQuestions(history)[0], 15)
    expect(flow.flowMode).toBe('review')
    expect(flow.totalTimeLimit).toBe(0)
    expect(flow.instantFeedback).toBe(true)
    // 作答時各作答方式混在一起
    expect(flow.mixStages).toBe(true)
    expect(flow.stages.reduce((sum, s) => sum + s.questionCount, 0)).toBe(15)
    // 階段依 PVQC 測驗順序：測驗一（寫）在測驗二（讀）前面
    expect(flow.stages.map((s) => s.mode)).toEqual(['pvqc_write', 'pvqc_read'])
    expect(countByKind(collectWrongQuestions(history)[0].items)).toEqual([
      ['測驗一：寫', 12],
      ['測驗二：讀', 8],
    ])
    for (const stage of flow.stages) {
      expect(stage.questionIds).toHaveLength(stage.questionCount)
    }
  })
})

describe('reviewSummary', () => {
  it('一次答對、再練答對、還要加強；不是複習紀錄回傳 null', () => {
    const [q1, q2, q3] = accounting.map((q) => q.id)
    const review = standard(
      'accounting',
      '2026-10-01',
      [
        { id: q1, correct: true },
        { id: q2, correct: false },
        { id: q3, correct: false },
      ],
      'review',
    )
    review.results.retryResults = [
      { questionId: q2, mode: 'standard', userAnswer: 0, isCorrect: true },
      { questionId: q3, mode: 'standard', userAnswer: 0, isCorrect: false },
    ]
    expect(reviewSummary(review)).toEqual({ first: 1, retry: 1, remaining: 1, total: 3 })
    expect(reviewSummary(standard('accounting', '2026-10-01', []))).toBeNull()
  })
})
