import { pickEnglishVoice } from '../tts'

const voice = (name: string, localService: boolean) =>
  ({ name, lang: 'en-US', localService }) as SpeechSynthesisVoice

describe('pickEnglishVoice', () => {
  // Windows 的 Chrome：偏好清單裡 Google US English（線上）排在 Microsoft Zira（內建）前面
  const voices = [
    voice('Microsoft Zira', true),
    voice('Google US English', false),
  ]

  it('有網路時依偏好清單挑選', () => {
    expect(pickEnglishVoice(voices)?.name).toBe('Google US English')
  })

  it('localOnly 時只挑裝置內建語音', () => {
    expect(pickEnglishVoice(voices, true)?.name).toBe('Microsoft Zira')
  })

  it('沒有內建語音時回傳 null', () => {
    expect(
      pickEnglishVoice([voice('Google US English', false)], true),
    ).toBeNull()
  })
})
