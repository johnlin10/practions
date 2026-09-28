import { describe, expect, it } from 'vitest'
import { appSettingsSchema } from '@/schemas/settings'

describe('appSettingsSchema theme', () => {
  const pvqc = { defaultQuestionCount: 30, defaultTimePerStage: 5 }

  it('舊版設定沒有 theme 時預設跟隨系統', () => {
    expect(appSettingsSchema.parse({ pvqc }).theme).toBe('system')
  })

  it('theme 不合法時退回跟隨系統，PVQC 設定保留', () => {
    const settings = appSettingsSchema.parse({ pvqc, theme: 'blue' })
    expect(settings.theme).toBe('system')
    expect(settings.pvqc).toEqual(pvqc)
  })

  it('保留手動選擇的深淺色', () => {
    expect(appSettingsSchema.parse({ pvqc, theme: 'dark' }).theme).toBe('dark')
  })
})
