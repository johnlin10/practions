/**
 * AppSettings 的 zod 驗證 schema
 *
 * 每個欄位都帶 .default()，因此即使 localStorage 內是部分/舊版設定，
 * 缺漏欄位也會自動補上預設值（取代原本 loadSettingsFromStorage 的手動合併）。
 */
import { z } from 'zod'
import { DEFAULT_SETTINGS } from '@/types/settings'

export const pvqcSettingsSchema = z.object({
  defaultQuestionCount: z
    .number()
    .default(DEFAULT_SETTINGS.pvqc.defaultQuestionCount),
  defaultTimePerStage: z
    .number()
    .default(DEFAULT_SETTINGS.pvqc.defaultTimePerStage),
})

export const appSettingsSchema = z.object({
  pvqc: pvqcSettingsSchema.default(DEFAULT_SETTINGS.pvqc),
})
