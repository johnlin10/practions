/**
 * HistoryRecord 的 zod 驗證 schema
 *
 * 策略：
 * - envelope（會導致白屏的關鍵欄位）嚴格驗證：id、subject.{id,name}、date
 * - date 用 z.coerce.date()，修正「存 Date → JSON 變字串」的型別漂移
 * - 深層的 Question / results / answers 等複雜結構寬鬆放行（looseObject 保留未知 key），
 *   不為複雜的 discriminated union 撰寫巨量 schema，也避免誤刪使用者資料
 */
import { z } from 'zod'

/**
 * 單筆歷史記錄 schema。
 * 使用 looseObject：未列出的欄位（recordType、flowMode、flowConfig、results、
 * duration、舊版相容欄位等）會原樣保留，僅對崩潰關鍵欄位做驗證。
 */
export const historyRecordSchema = z.looseObject({
  id: z.string().min(1),
  subject: z.looseObject({
    id: z.string().min(1),
    name: z.string(),
  }),
  date: z.coerce.date(),
})

export type ValidatedHistoryRecord = z.infer<typeof historyRecordSchema>
