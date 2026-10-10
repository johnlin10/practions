/**
 * 答對／答錯音效：用 Web Audio 即時合成，不需要音檔
 *
 * 每個音由兩層組成：三角波主音＋低八度的正弦波撐厚度。
 * iOS 上 Web Audio 預設跟著靜音鍵、也不會打斷正在播的音樂。
 * iOS 只允許在使用者操作時啟動音訊，所以每次點擊都確認一次，切到背景被暫停也能恢復。
 */
import { getSettings } from '@/data/settingsStore'

let ctx: AudioContext | null = null

function unlock(): void {
  ctx ??= new AudioContext()
  if (ctx.state !== 'running') void ctx.resume()
}

if (typeof window !== 'undefined' && 'AudioContext' in window) {
  window.addEventListener('pointerdown', unlock, { capture: true })
  window.addEventListener('keydown', unlock, { capture: true })
}

/** 一個音：start 秒後開始，duration 秒內淡出。 */
function tone(
  frequency: number,
  start: number,
  duration: number,
  type: OscillatorType,
  volume: number,
): void {
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  const t = ctx.currentTime + start
  oscillator.type = type
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(volume, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(t)
  oscillator.stop(t + duration + 0.05)
}

/** 答對：G 大三和弦（Sol Si Re）快速上行；答錯：Sol → Mi 下行。設定關閉音效時不播。 */
export function playFeedbackSound(correct: boolean): void {
  if (!ctx || ctx.state !== 'running' || !getSettings().sound) return
  if (correct) {
    ;[392, 493.88, 587.33].forEach((f, i) => {
      tone(f, i * 0.07, 0.42, 'triangle', 0.22)
      tone(f / 2, i * 0.07, 0.55, 'sine', 0.24)
    })
  } else {
    tone(392, 0, 0.2, 'triangle', 0.22)
    tone(329.6, 0.1, 0.4, 'triangle', 0.22)
    tone(164.8, 0.1, 0.4, 'sine', 0.12)
  }
}
