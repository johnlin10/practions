import { generatePVQCOptions } from '../pvqc-helpers'
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
