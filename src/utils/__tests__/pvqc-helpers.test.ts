import { generatePVQCOptions, generatePVQCPronunciationOptions } from '../pvqc-helpers'
import { isSpelledRight, pvqcWriteScoringStrategy } from '../scoring'
import { subjects } from '@/data/subjects'
import type { VocabularyQuestion } from '@/types/questions'

const vocab = subjects.pvqc_ai.questions as VocabularyQuestion[]

describe('generatePVQCOptions', () => {
  it('4 個不重複的選項，包含正確答案，且正確答案會出現在每個位置', () => {
    const target = vocab[0]
    const positions = new Set<number>()
    for (let i = 0; i < 200; i++) {
      const { options, correctIndex } = generatePVQCOptions(target, vocab, 'pvqc_read')
      expect(options).toHaveLength(4)
      expect(new Set(options).size).toBe(4)
      expect(options[correctIndex]).toBe(target.chinese)
      positions.add(correctIndex)
    }
    expect(positions.size).toBe(4)
  })
})

describe('縮寫和完整名稱中文一樣（PVQC AI 擴充）', () => {
  const ai = subjects.pvqc_ai_extended.questions as VocabularyQuestion[]
  const pairs = ai.filter((q) => q.sameMeaning)

  it('43 組縮寫都跟完整名稱同一個中文，且不再標「（縮寫）」', () => {
    expect(ai.some((q) => q.chinese.includes('縮寫'))).toBe(false)
    expect(pairs).toHaveLength(86)
    for (const q of pairs) {
      const others = ai.filter((o) => o !== q && o.chinese === q.chinese)
      expect(q.sameMeaning).toEqual(others.map((o) => o.english))
    }
  })

  it('拼字題：縮寫、完整名稱都算對，只打一半不算', () => {
    for (const q of pairs) {
      for (const e of [q.english, ...q.sameMeaning!]) {
        expect(isSpelledRight(e.toUpperCase(), q)).toBe(true)
        expect(pvqcWriteScoringStrategy.evaluate(q, { answer: ` ${e} ` } as never)).toBe(true)
      }
      expect(isSpelledRight(q.english.slice(0, -1), q)).toBe(false)
    }
  })

  it('每一種題型的選項都不會撞在一起（整個題庫抽 30 次）', () => {
    for (const q of pairs) {
      for (let i = 0; i < 30; i++) {
        for (const mode of ['pvqc_read', 'pvqc_listen_chinese'] as const) {
          const { options, correctIndex } = generatePVQCOptions(q, ai, mode)
          expect(new Set(options).size).toBe(4)
          expect(options[correctIndex]).toBe(q.chinese)
          expect(options.filter((o) => o === q.chinese)).toHaveLength(1)
        }
        const english = [
          generatePVQCOptions(q, ai, 'pvqc_listen_english'),
          generatePVQCPronunciationOptions(q, ai),
        ]
        for (const { options, correctIndex } of english) {
          expect(new Set(options).size).toBe(4)
          expect(options[correctIndex]).toBe(q.english)
          for (const other of q.sameMeaning!) expect(options).not.toContain(other)
        }
      }
    }
  })

  it('題庫只剩 5 個字時，另一個名稱也不會被抽成干擾選項', () => {
    const abbr = ai.find((q) => q.english === 'AI')!
    const full = ai.find((q) => q.english === 'artificial intelligence')!
    const small = [abbr, full, ...ai.filter((q) => !q.sameMeaning).slice(0, 3)]
    for (let i = 0; i < 50; i++) {
      expect(generatePVQCPronunciationOptions(abbr, small).options).not.toContain('artificial intelligence')
      expect(generatePVQCOptions(full, small, 'pvqc_listen_english').options).not.toContain('AI')
      const { options } = generatePVQCOptions(abbr, small, 'pvqc_read')
      expect(options.filter((o) => o === abbr.chinese)).toHaveLength(1)
    }
  })
})
