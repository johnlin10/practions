import { randomPrepareFrames, randomPrepareMs } from '../prepare-progress'

describe('prepare-progress', () => {
  it('長度在 1.8～2.8 秒之間', () => {
    for (let i = 0; i < 100; i++) {
      const ms = randomPrepareMs()
      expect(ms).toBeGreaterThanOrEqual(1800)
      expect(ms).toBeLessThanOrEqual(2800)
    }
  })

  it('進度從 0 開始、只往前不倒退，最後剛好跑滿', () => {
    for (let i = 0; i < 100; i++) {
      const frames = randomPrepareFrames()
      const offsets = frames.map((f) => f.offset as number)
      const widths = frames.map((f) => parseFloat(f.width as string))
      expect(offsets[0]).toBe(0)
      expect(offsets[offsets.length - 1]).toBeCloseTo(1)
      expect(widths[0]).toBe(0)
      expect(widths[widths.length - 1]).toBe(100)
      for (let j = 1; j < frames.length; j++) {
        expect(offsets[j]).toBeGreaterThan(offsets[j - 1])
        expect(widths[j]).toBeGreaterThanOrEqual(widths[j - 1])
        expect(widths[j]).toBeLessThanOrEqual(100)
      }
    }
  })
})
