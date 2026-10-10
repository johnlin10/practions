/**
 * 「正在準備」畫面的隨機長度與進度：每次都不一樣，看起來才像真的在處理
 */

/** 準備畫面停留的時間（毫秒），1.8～2.8 秒之間。 */
export function randomPrepareMs(): number {
  return 1800 + Math.random() * 1000
}

/**
 * 進度條的關鍵影格：分成 3～4 段，每段往前跑一截、停頓一下，最後跑滿。
 * 每段的距離、速度和停頓長短都隨機。
 */
export function randomPrepareFrames(): Keyframe[] {
  const steps = 3 + Math.floor(Math.random() * 2)
  const segments: { move: number; hold: number; to: number }[] = []
  let width = 0
  for (let i = 0; i < steps; i++) {
    const last = i === steps - 1
    // 平均分配剩下的距離，再隨機多跑或少跑一些
    width = last
      ? 100
      : width + ((100 - width) / (steps - i)) * (0.6 + Math.random() * 0.8)
    segments.push({
      move: 0.6 + Math.random(),
      hold: last ? 0 : Math.random() * 0.8,
      to: width,
    })
  }

  const total = segments.reduce((sum, s) => sum + s.move + s.hold, 0)
  const frames: Keyframe[] = [{ offset: 0, width: '0%', easing: 'ease-out' }]
  let time = 0
  for (const { move, hold, to } of segments) {
    time += move
    frames.push({ offset: time / total, width: `${to}%` })
    if (hold) {
      time += hold
      frames.push({
        offset: time / total,
        width: `${to}%`,
        easing: 'ease-in-out',
      })
    }
  }
  // 浮點數加總可能差一點點，最後一格一定要是 1，否則結尾會往回縮
  frames[frames.length - 1].offset = 1
  return frames
}
