import {
  REMOVE_AFTER,
  buildReviewFlow,
  collectWrongQuestions,
  countByKind,
  dueToday,
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

// 還沒移出的錯題（不含移出後之後要回顧的題目）
const ids = (history: HistoryRecord[], subjectId: string) =>
  collectWrongQuestions(history)
    .find((group) => group.subject.id === subjectId)
    ?.items.filter((item) => item.streak.count < REMOVE_AFTER)
    .map((item) => item.question.id) ?? []

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

  it('在 2 個不同的日子答對才移出，中間又答錯就重新計算（含複習紀錄）', () => {
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

  // 帶時間的本地格式，避免不同時區的機器算出不同的日期
  it('同一天重複答對只算一次，隔天再答對才移出', () => {
    const wrong = standard('accounting', '2026-10-01T20:00', [{ id: q1, correct: false }])
    const right1 = standard('accounting', '2026-10-01T20:10', [{ id: q1, correct: true }], 'review')
    const right2 = standard('accounting', '2026-10-01T20:20', [{ id: q1, correct: true }], 'review')
    const nextDay = standard('accounting', '2026-10-02T12:00', [{ id: q1, correct: true }])

    expect(ids([wrong, right1, right2], 'accounting')).toEqual([q1])
    expect(ids([wrong, right1, right2, nextDay], 'accounting')).toEqual([])
  })

  it('答對後又答錯就歸零，隔天答對只算一次', () => {
    const history = [
      standard('accounting', '2026-10-01T20:00', [{ id: q1, correct: false }]),
      standard('accounting', '2026-10-01T20:10', [{ id: q1, correct: true }]),
      standard('accounting', '2026-10-01T20:20', [{ id: q1, correct: false }]),
      standard('accounting', '2026-10-02T12:00', [{ id: q1, correct: true }]),
    ]
    expect(ids(history, 'accounting')).toEqual([q1])
  })

  it('「再練一次」答對和同一天的答對只算一次', () => {
    const review = standard('accounting', '2026-10-01T20:00', [{ id: q1, correct: false }], 'review')
    review.results.retryResults = [
      { questionId: q1, mode: 'standard', userAnswer: 0, isCorrect: true },
    ]
    const sameDay = standard('accounting', '2026-10-01T21:00', [{ id: q1, correct: true }])
    expect(ids([review, sameDay], 'accounting')).toEqual([q1])
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

describe('dueToday', () => {
  const [q1, q2] = accounting.map((q) => q.id)
  const today = new Date('2026-10-02T21:00')

  it('今天已經答對過的錯題先不出現，今天沒題可練的科目不列出', () => {
    const history = [
      standard('accounting', '2026-10-01T20:00', [
        { id: q1, correct: false },
        { id: q2, correct: false },
      ]),
      standard('accounting', '2026-10-02T09:00', [{ id: q1, correct: true }], 'review'),
    ]
    const groups = collectWrongQuestions(history)
    expect(groups[0].items).toHaveLength(2)
    expect(dueToday(groups, today)[0].items.map((item) => item.question.id)).toEqual([q2])
    // 前一天答對的照常出現（隔天確認）
    expect(dueToday(groups, new Date('2026-10-03T12:00'))[0].items).toHaveLength(2)

    history.push(standard('accounting', '2026-10-02T09:10', [{ id: q2, correct: true }], 'review'))
    expect(dueToday(collectWrongQuestions(history), today)).toEqual([])
  })

  it('隔天但不到 8 小時，答對的錯題還不出現，也不累積', () => {
    const history = [
      standard('accounting', '2026-10-01T20:00', [{ id: q1, correct: false }]),
      standard('accounting', '2026-10-01T23:59', [{ id: q1, correct: true }], 'review'),
    ]
    const groups = collectWrongQuestions(history)
    expect(dueToday(groups, new Date('2026-10-02T00:01'))).toEqual([])
    expect(dueToday(groups, new Date('2026-10-02T07:58'))).toEqual([])
    expect(dueToday(groups, new Date('2026-10-02T07:59'))[0].items).toHaveLength(1)

    // 0:30 又答對不算第二天，還留在錯題
    history.push(standard('accounting', '2026-10-02T00:30', [{ id: q1, correct: true }], 'review'))
    expect(collectWrongQuestions(history)[0].items[0].streak.count).toBe(1)
    history.push(standard('accounting', '2026-10-02T08:00', [{ id: q1, correct: true }], 'review'))
    expect(collectWrongQuestions(history)[0].items[0].streak.count).toBe(REMOVE_AFTER)
  })

  it('凌晨 3 點才換日：半夜交卷算前一天', () => {
    const wrong = standard('accounting', '2026-10-01T20:00', [{ id: q1, correct: false }])
    const at = (date: string) => [
      wrong,
      standard('accounting', date, [{ id: q1, correct: true }], 'review'),
    ]
    // 0:05 交卷算 10/1，同一天 8:05 就可以再複習
    const midnight = collectWrongQuestions(at('2026-10-02T00:05'))
    expect(dueToday(midnight, new Date('2026-10-02T08:04'))).toEqual([])
    expect(dueToday(midnight, new Date('2026-10-02T08:05'))[0].items).toHaveLength(1)
    // 3:30 交卷算 10/2，要到 10/3 凌晨 3 點
    const late = collectWrongQuestions(at('2026-10-02T03:30'))
    expect(dueToday(late, new Date('2026-10-03T02:59'))).toEqual([])
    expect(dueToday(late, new Date('2026-10-03T03:00'))[0].items).toHaveLength(1)
  })
})

describe('移出後的回顧', () => {
  const [q1] = accounting.map((q) => q.id)
  const answer = (day: string, correct: boolean) =>
    standard('accounting', `${day}T20:00`, [{ id: q1, correct }])
  // 10/3 移出錯題，3 天後（10/6）第一次回顧
  const graduated = [
    answer('2026-10-01', false),
    answer('2026-10-02', true),
    answer('2026-10-03', true),
  ]
  const due = (history: HistoryRecord[], today: string) =>
    dueToday(collectWrongQuestions(history), new Date(`${today}T12:00`)).flatMap((group) =>
      group.items.map((item) => item.question.id),
    )

  it('到期才出現，太早答對不算，到期答對後隔更久', () => {
    expect(ids(graduated, 'accounting')).toEqual([])
    expect(due(graduated, '2026-10-05')).toEqual([])
    expect(due(graduated, '2026-10-06')).toEqual([q1])

    expect(due([...graduated, answer('2026-10-05', true)], '2026-10-06')).toEqual([q1])

    const passed = [...graduated, answer('2026-10-06', true)]
    expect(due(passed, '2026-10-12')).toEqual([])
    expect(due(passed, '2026-10-13')).toEqual([q1])
  })

  it('晚了才答從答對那天重新起算，三次都通過後不再出現', () => {
    const late = [...graduated, answer('2026-10-20', true)]
    expect(due(late, '2026-10-26')).toEqual([])
    expect(due(late, '2026-10-27')).toEqual([q1])

    const all = [
      ...graduated,
      answer('2026-10-06', true),
      answer('2026-10-13', true),
      answer('2026-10-27', true),
    ]
    expect(collectWrongQuestions(all)).toEqual([])
  })

  it('回顧時答錯就回到錯題，從頭計算', () => {
    const history = [...graduated, answer('2026-10-06', false)]
    expect(ids(history, 'accounting')).toEqual([q1])
    expect(collectWrongQuestions(history)[0].items[0].streak.count).toBe(0)
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


  it('先出之前某天答對過一次的，其餘新錯題與老錯題交替，新錯題不會被擠掉', () => {
    const qs = accounting.slice(0, 36).map((q) => q.id)
    const [confirm, ...rest] = qs
    const stubborn = rest.slice(0, 30)
    const fresh = rest.slice(30)
    const wrong = (date: string, list: string[]) =>
      standard('accounting', date, list.map((id) => ({ id, correct: false })))
    const history = [
      wrong('2026-10-01T20:00', [...stubborn, confirm]),
      wrong('2026-10-02T20:00', stubborn),
      wrong('2026-10-03T20:00', stubborn),
      standard('accounting', '2026-10-04T20:00', [{ id: confirm, correct: true }], 'review'),
      wrong('2026-10-05T20:00', fresh),
    ]
    const group = dueToday(collectWrongQuestions(history), new Date('2026-10-06T12:00'))[0]
    const picked = buildReviewFlow(group, 15).stages.flatMap((s) => s.questionIds ?? [])

    expect(picked).toHaveLength(15)
    expect(picked[0]).toBe(confirm)
    expect(picked.filter((id) => fresh.includes(id))).toHaveLength(fresh.length)
    // 新錯題與老錯題交替
    expect(fresh.includes(picked[1]) && stubborn.includes(picked[2])).toBe(true)
  })

  it('到期的回顧題最多佔一半，錯題不夠時由回顧題補滿', () => {
    const qs = accounting.slice(0, 30).map((q) => q.id)
    const reviews = qs.slice(0, 10)
    const wrongs = qs.slice(10)
    const answers = (day: string, list: string[], correct: boolean) =>
      standard('accounting', `${day}T20:00`, list.map((id) => ({ id, correct })))
    const graduated = [
      answers('2026-10-01', reviews, false),
      answers('2026-10-02', reviews, true),
      answers('2026-10-03', reviews, true),
    ]
    const pick = (history: HistoryRecord[]) =>
      buildReviewFlow(dueToday(collectWrongQuestions(history), new Date('2026-10-06T12:00'))[0], 15)
        .stages.flatMap((s) => s.questionIds ?? [])

    const picked = pick([...graduated, answers('2026-10-05', wrongs, false)])
    expect(picked).toHaveLength(15)
    expect(picked.filter((id) => reviews.includes(id))).toHaveLength(8)

    expect(pick([...graduated, answers('2026-10-05', wrongs.slice(0, 3), false)])).toHaveLength(13)
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
