/**
 * 自訂彈窗（取代 window.alert / window.confirm）
 *
 * 任何地方呼叫 showAlert / showConfirm 都會排進佇列，由 App 裡的 <Dialog /> 依序顯示。
 * 與原生彈窗不同，不會暫停程式執行：需要等使用者回應時請 await。
 */
import { useSyncExternalStore } from 'react'

export interface DialogOptions {
  title?: string
  confirmText?: string
  // 有 cancelText 才顯示取消按鈕（confirm）
  cancelText?: string
  // 刪除等無法復原的操作，確認按鈕改為紅色
  danger?: boolean
}

export interface DialogRequest extends DialogOptions {
  message: string
  resolve: (ok: boolean) => void
}

let queue: DialogRequest[] = []
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function setQueue(next: DialogRequest[]): void {
  queue = next
  listeners.forEach((listener) => listener())
}

function open(request: Omit<DialogRequest, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => setQueue([...queue, { ...request, resolve }]))
}

/** 顯示訊息，使用者按下確定後 resolve。 */
export function showAlert(
  message: string,
  options: Omit<DialogOptions, 'cancelText'> = {},
): Promise<void> {
  return open({ confirmText: '確定', ...options, message }).then(() => {})
}

/** 詢問使用者，按確定 resolve true，取消（含按 Esc、點背景）resolve false。 */
export function showConfirm(
  message: string,
  options: DialogOptions = {},
): Promise<boolean> {
  return open({ confirmText: '確定', cancelText: '取消', ...options, message })
}

/** 由 <Dialog /> 呼叫：關閉目前的彈窗並回傳結果。 */
export function closeDialog(ok: boolean): void {
  const [current, ...rest] = queue
  if (!current) return
  setQueue(rest)
  current.resolve(ok)
}

/** React hook：目前要顯示的彈窗。 */
export function useDialog(): DialogRequest | undefined {
  return useSyncExternalStore(subscribe, () => queue[0])
}
