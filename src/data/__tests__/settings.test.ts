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

describe('appSettingsSchema reviewLimit', () => {
  const pvqc = { defaultQuestionCount: 30, defaultTimePerStage: 5 }

  it('v3.6 以前的設定沒有複習題數時預設 15 題，其他設定保留', () => {
    const settings = appSettingsSchema.parse({ pvqc, theme: 'dark' })
    expect(settings.reviewLimit).toBe(15)
    expect(settings.theme).toBe('dark')
    expect(settings.pvqc).toEqual(pvqc)
  })

  it('不在選項內的題數退回 15 題', () => {
    for (const reviewLimit of [7, '10', null, -5]) {
      expect(appSettingsSchema.parse({ pvqc, reviewLimit }).reviewLimit).toBe(15)
    }
  })

  it('保留選擇的題數', () => {
    expect(appSettingsSchema.parse({ pvqc, reviewLimit: 20 }).reviewLimit).toBe(20)
  })
})
