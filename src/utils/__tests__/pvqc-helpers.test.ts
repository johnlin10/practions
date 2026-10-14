import { generatePVQCOptions, generatePVQCPronunciationOptions } from '../pvqc-helpers'
import { isSpelledRight } from '../scoring'
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

describe('縮寫和完整名稱中文一樣', () => {
  const ai = subjects.pvqc_ai_extended.questions as VocabularyQuestion[]
  const abbr = ai.find((q) => q.english === 'AI')!
  const full = ai.find((q) => q.english === 'artificial intelligence')!

  it('中文一樣，彼此記為同義', () => {
    expect(abbr.chinese).toBe(full.chinese)
    expect(abbr.sameMeaning).toEqual(['artificial intelligence'])
    expect(full.sameMeaning).toEqual(['AI'])
  })
  it('拼字題打縮寫或完整名稱都算對', () => {
    expect(isSpelledRight('ai', full)).toBe(true)
    expect(isSpelledRight('Artificial Intelligence', abbr)).toBe(true)
    expect(isSpelledRight('artificial', abbr)).toBe(false)
  })
  it('選英文時不會同時出現縮寫和完整名稱；選中文時只會有一個「人工智慧」', () => {
    // 只留 4 個字，干擾選項一定會抽到另一個名稱，除非有排除
    const small = [abbr, full, ...ai.filter((q) => !q.sameMeaning).slice(0, 3)]
    for (let i = 0; i < 50; i++) {
      expect(generatePVQCPronunciationOptions(abbr, small).options).not.toContain('artificial intelligence')
      expect(generatePVQCOptions(full, small, 'pvqc_listen_english').options).not.toContain('AI')
      const { options } = generatePVQCOptions(abbr, small, 'pvqc_read')
      expect(options.filter((o) => o === abbr.chinese)).toHaveLength(1)
    }
  })
})
