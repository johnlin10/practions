import { z } from 'zod'
import { readValidated, write, remove } from '../storage'
import { historyRecordSchema } from '@/schemas/history'

const KEY = 'test_key'
const schema = z.object({ n: z.number() })

beforeEach(() => {
  localStorage.clear()
})

describe('readValidated', () => {
  it('key 不存在時回傳 fallback', () => {
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: -1 })
  })

  it('JSON 損壞時回傳 fallback', () => {
    localStorage.setItem(KEY, '{ not valid json')
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: -1 })
  })

  it('驗證不通過時回傳 fallback', () => {
    localStorage.setItem(KEY, JSON.stringify({ n: 'not a number' }))
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: -1 })
  })

  it('驗證通過時回傳解析後的資料', () => {
    write(KEY, { n: 42 })
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: 42 })
  })
})

describe('write / remove', () => {
  it('write 後可讀回，remove 後回到 fallback', () => {
    write(KEY, { n: 7 })
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: 7 })
    remove(KEY)
    expect(readValidated(KEY, schema, { n: -1 })).toEqual({ n: -1 })
  })
})

describe('historyRecordSchema', () => {
  const valid = {
    id: 'rec-1',
    subject: { id: 's1', name: '數學', baseQuestionType: 'single_choice' },
    recordType: 'standard',
    date: '2025-01-02T03:04:05.000Z',
    results: { totalCorrect: 3, totalQuestions: 5 },
  }

  it('將 date 字串 coerce 成 Date 實例', () => {
    const r = historyRecordSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.date).toBeInstanceOf(Date)
  })

  it('保留未列出的 envelope 欄位（recordType、results）', () => {
    const r = historyRecordSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.recordType).toBe('standard')
      expect(r.data.results).toEqual({ totalCorrect: 3, totalQuestions: 5 })
    }
  })

  it('缺少 id 時驗證失敗', () => {
    const { id: _id, ...noId } = valid
    expect(historyRecordSchema.safeParse(noId).success).toBe(false)
  })

  it('缺少 subject.name 時驗證失敗', () => {
    const bad = { ...valid, subject: { id: 's1' } }
    expect(historyRecordSchema.safeParse(bad).success).toBe(false)
  })
})
