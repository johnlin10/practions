/**
 * AppSettings 的 zod 驗證 schema
 *
 * 每個欄位都帶 .default()，因此即使 localStorage 內是部分/舊版設定，
 * 缺漏欄位也會自動補上預設值（取代原本 loadSettingsFromStorage 的手動合併）。
 */
import { z } from 'zod'
import { DEFAULT_SETTINGS, REVIEW_LIMITS } from '@/types/settings'

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
  // 缺漏或不合法時退回預設，不讓整份設定（含 PVQC）一起被丟棄
  theme: z.enum(['system', 'light', 'dark']).catch(DEFAULT_SETTINGS.theme),
  reviewLimit: z
    .number()
    .refine((n) => (REVIEW_LIMITS as readonly number[]).includes(n))
    .catch(DEFAULT_SETTINGS.reviewLimit),
  sound: z.boolean().catch(DEFAULT_SETTINGS.sound),
})
