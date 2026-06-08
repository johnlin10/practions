/**
 * 通用安全 localStorage 封裝
 *
 * 全應用程式唯一進行 JSON.parse / JSON.stringify 與 zod 驗證的地方。
 * 讀取失敗（不存在 / JSON 損壞 / 驗證不過）一律回傳 fallback 並 warn，
 * 避免單筆壞資料導致整頁白屏。
 */
import type { ZodType } from 'zod'

/**
 * 以 zod schema 驗證後讀取單一物件。
 * @param key localStorage 鍵
 * @param schema 驗證用 zod schema
 * @param fallback 驗證失敗或不存在時的回傳值
 */
export function readValidated<T>(
  key: string,
  schema: ZodType<T>,
  fallback: T,
): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback

    const parsed: unknown = JSON.parse(raw)
    const result = schema.safeParse(parsed)
    if (!result.success) {
      console.warn(
        `[storage] 驗證失敗，使用 fallback（key=${key}）：`,
        result.error.issues,
      )
      return fallback
    }
    return result.data
  } catch (error) {
    console.warn(`[storage] 讀取失敗，使用 fallback（key=${key}）：`, error)
    return fallback
  }
}

/**
 * 寫入物件（自動 JSON.stringify）。
 */
export function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[storage] 寫入失敗（key=${key}）：`, error)
  }
}

/**
 * 移除指定鍵。
 */
export function remove(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`[storage] 移除失敗（key=${key}）：`, error)
  }
}

/**
 * 讀取原始字串（不解析、不驗證），用於遷移判斷等情境。
 */
export function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
