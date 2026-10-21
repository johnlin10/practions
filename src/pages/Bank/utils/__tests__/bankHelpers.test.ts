import { describe, expect, it } from 'vitest'
import { groupWords, sortWords } from '../bankHelpers'

const words = ['threshold', 'ai', 'energy', 'Domain', 'stream'].map(
  (english) => ({ english }),
)

describe('sortWords', () => {
  it('由短到長，一樣長的維持原本順序', () => {
    expect(sortWords(words, 'short', []).map((w) => w.english)).toEqual([
      'ai',
      'energy',
      'Domain',
      'stream',
      'threshold',
    ])
  })

  it('字母順序不分大小寫，不改到原本的陣列', () => {
    expect(sortWords(words, 'alphabet', []).map((w) => w.english)).toEqual([
      'ai',
      'Domain',
      'energy',
      'stream',
      'threshold',
    ])
    expect(words[0].english).toBe('threshold')
  })

  it('隨機用傳進來洗好的順序', () => {
    const shuffled = [...words].reverse()
    expect(sortWords(words, 'random', shuffled)).toBe(shuffled)
  })
})

describe('groupWords', () => {
  it('每 20 字一組，最後一組到最後一個字', () => {
    const groups = groupWords(Array.from({ length: 45 }, (_, i) => i), 'twenty')
    expect(groups.map((g) => g.title)).toEqual(['1–20', '21–40', '41–45'])
    expect(groups[2].words).toEqual([40, 41, 42, 43, 44])
  })

  it('不分組時只有一組、沒有組名', () => {
    expect(groupWords([1, 2], 'none')).toEqual([{ title: '', words: [1, 2] }])
  })
})
