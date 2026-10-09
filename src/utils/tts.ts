/**
 * TTS（語音合成）工具
 *
 * 使用瀏覽器內建 Web Speech API 播放英文單字。
 * PVQC 聽力題會在切題時自動播放，也允許使用者手動重播。
 *
 * 部分語音是線上語音（localService 為 false，例如 Chrome 的 Google US English、
 * Edge 的 Online (Natural)），離線時無法播放：離線時只用裝置內建語音，線上語音播放失敗時也改用內建語音重播。
 */

let cachedVoices: SpeechSynthesisVoice[] = []
let cachedPickedVoice: SpeechSynthesisVoice | null = null
let activeUtterance: SpeechSynthesisUtterance | null = null

const PREFERRED_VOICE_NAMES = [
  'Samantha',
  'Alex',
  'Allison',
  'Ava',
  'Susan',
  'Google US English',
  'Microsoft Aria Online (Natural)',
  'Microsoft Jenny Online (Natural)',
  'Microsoft Guy Online (Natural)',
  'Microsoft Aria',
  'Microsoft Zira',
  'Microsoft David',
]

/** 挑選英文語音；localOnly 時只從裝置內建語音挑。 */
export function pickEnglishVoice(
  voices: SpeechSynthesisVoice[],
  localOnly = false
): SpeechSynthesisVoice | null {
  if (localOnly) voices = voices.filter((v) => v.localService)
  if (!voices || voices.length === 0) return null

  const enVoices = voices.filter((v) => v.lang && v.lang.startsWith('en'))
  const pool = enVoices.length > 0 ? enVoices : voices

  for (const name of PREFERRED_VOICE_NAMES) {
    const match = pool.find((v) => v.name && v.name.includes(name))
    if (match) return match
  }

  return (
    pool.find((v) => v.lang === 'en-US') ??
    pool.find((v) => v.lang === 'en-GB') ??
    pool[0] ??
    null
  )
}

function refreshVoices(): void {
  if (!('speechSynthesis' in window)) return

  const voices = window.speechSynthesis.getVoices() || []
  if (voices.length > 0) {
    cachedVoices = voices
    cachedPickedVoice = pickEnglishVoice(voices)
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices()
  window.speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

interface SpeakOptions {
  rate?: number
  pitch?: number
  volume?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: (errorCode?: string) => void
  // 只用裝置內建語音（線上語音播放失敗後重播時使用）
  localOnly?: boolean
}

export function speakEnglish(text: string, opts: SpeakOptions = {}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    opts.onError?.('synthesis-unavailable')
    return
  }

  const synth = window.speechSynthesis

  if (cachedVoices.length === 0) refreshVoices()
  if (synth.paused) synth.resume()

  const utterance = new SpeechSynthesisUtterance(text)
  const localOnly = opts.localOnly || !navigator.onLine
  const voice = localOnly
    ? (pickEnglishVoice(cachedVoices, true) ?? cachedPickedVoice)
    : cachedPickedVoice

  utterance.lang = voice?.lang || 'en-US'
  utterance.rate = opts.rate ?? 0.9
  utterance.pitch = opts.pitch ?? 1
  utterance.volume = opts.volume ?? 1
  if (voice) utterance.voice = voice

  let finished = false
  let watchdog: ReturnType<typeof setTimeout> | null = null

  const finish = (kind: 'end' | 'error', errorCode?: string) => {
    if (finished) return
    finished = true
    if (activeUtterance === utterance) activeUtterance = null
    if (watchdog) {
      clearTimeout(watchdog)
      watchdog = null
    }

    if (kind === 'end') opts.onEnd?.()
    else opts.onError?.(errorCode)
  }

  utterance.onstart = () => opts.onStart?.()
  utterance.onend = () => finish('end')
  utterance.onerror = (ev: SpeechSynthesisErrorEvent) => {
    const code = ev?.error
    if (code === 'canceled' || code === 'interrupted') {
      finish('end')
      return
    }

    // 線上語音連不上：改用裝置內建語音重播一次
    if (!localOnly && voice && !voice.localService) {
      finished = true
      if (watchdog) clearTimeout(watchdog)
      if (activeUtterance === utterance) activeUtterance = null
      speakEnglish(text, { ...opts, localOnly: true })
      return
    }

    console.warn('[tts] speak error:', code, 'text=', text)
    finish('error', code)
  }

  const rate = opts.rate ?? 0.9
  const expectedMs = Math.max(2500, (text.length * 120) / rate) + 2500
  watchdog = setTimeout(() => {
    if (!finished) {
      synth.cancel()
      finish('end')
    }
  }, expectedMs)

  activeUtterance = utterance
  synth.cancel()
  synth.speak(utterance)
}

export function cancelSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  activeUtterance = null
}

export function getCachedVoices(): SpeechSynthesisVoice[] {
  return cachedVoices
}
