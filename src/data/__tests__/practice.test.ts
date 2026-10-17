import { describe, expect, it } from 'vitest'
import { buildPracticeFlow, defaultPracticeSubject } from '@/data/practice'
import { subjects } from '@/data/subjects'
import { appSettingsSchema } from '@/schemas/settings'
import type { HistoryRecord } from '@/types'

const record = (subjectId: string, date: string) =>
  ({ subject: { id: subjectId }, date }) as unknown as HistoryRecord

describe('buildPracticeFlow', () => {
  it('一般題庫：一個階段，不計時、即時回饋', () => {
    const flow = buildPracticeFlow(subjects.accounting, 25)
    expect(flow.flowMode).toBe('practice')
    expect(flow.instantFeedback).toBe(true)
    expect(flow.totalTimeLimit).toBe(0)
    expect(flow.stages).toHaveLength(1)
    expect(flow.stages[0]).toMatchObject({
      mode: 'standard',
      questionCount: 25,
    })
  })

  it('單字題庫：題數平均分給六種作答方式，打散成一條流程', () => {
    const flow = buildPracticeFlow(subjects.pvqc_ai, 20)
    expect(flow.mixStages).toBe(true)
    expect(flow.stages.map((s) => s.questionCount)).toEqual([4, 4, 3, 3, 3, 3])
  })

  it('單字題庫不含 Spelling：不出看中拼英，題數分給其餘五種', () => {
    const flow = buildPracticeFlow(subjects.pvqc_ai, 20, false)
    expect(flow.stages.map((s) => s.mode)).not.toContain('pvqc_write')
    expect(flow.stages.map((s) => s.questionCount)).toEqual([4, 4, 4, 4, 4])
  })
})

describe('defaultPracticeSubject', () => {
  const history = [
    record('accounting', '2026-10-01T10:00:00'),
    record('erp_distribution', '2026-10-02T10:00:00'),
  ]

  const at = (date: string) => new Date(date).getTime()

  it('手動選擇比最後一次作答新，就用選的', () => {
    const savedAt = at('2026-10-03T10:00:00')
    expect(defaultPracticeSubject('accounting', savedAt, history)?.id).toBe(
      'accounting',
    )
  })

  it('選了之後又作答，就用最後作答的題庫', () => {
    const savedAt = at('2026-10-01T12:00:00')
    expect(
      defaultPracticeSubject('information_security', savedAt, history)?.id,
    ).toBe('erp_distribution')
  })

  it('沒選過（或選過的已經不在）就用最近作答的題庫', () => {
    expect(defaultPracticeSubject('', 0, history)?.id).toBe('erp_distribution')
    expect(defaultPracticeSubject('gone', at('2026-10-09'), history)?.id).toBe(
      'erp_distribution',
    )
  })

  it('沒有作答紀錄時用選的，都沒有時為 undefined', () => {
    expect(defaultPracticeSubject('accounting', 1, [])?.id).toBe('accounting')
    expect(defaultPracticeSubject('', 0, [])).toBeUndefined()
  })
})

describe('appSettingsSchema 隨手練', () => {
  it('舊版設定沒有隨手練欄位時預設 20 題、還沒選題庫；超出範圍退回預設', () => {
    const settings = appSettingsSchema.parse({})
    expect(settings.practiceLimit).toBe(20)
    expect(settings.practiceSubject).toBe('')
    expect(appSettingsSchema.parse({ practiceLimit: 80 }).practiceLimit).toBe(
      20,
    )
  })
})
