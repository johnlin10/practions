/**
 * 登入狀態（單一資料來源）
 *
 * Firebase 只在「這個瀏覽器登入過」或按下登入時才動態載入（cloud.ts），
 * 訪客不下載 Firebase，bundle 大小不變。
 */
import { useSyncExternalStore } from 'react'
import { STORAGE_KEYS } from '@/types'
import { readRaw } from '@/utils/storage'
import { detachCloud } from './historyStore'

export interface AuthState {
  // checking：登入過的瀏覽器正在恢復登入狀態
  status: 'guest' | 'checking' | 'signed-in'
  email?: string
  // 登入後從本機同步到雲端的筆數（本次開啟期間顯示）
  synced?: number
  error?: string
}

let state: AuthState = {
  status: readRaw(STORAGE_KEYS.SIGNED_IN) ? 'checking' : 'guest',
}
const listeners = new Set<() => void>()

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getState(): AuthState {
  return state
}

/** 由 cloud.ts 更新登入狀態。 */
export function setAuthState(next: AuthState): void {
  state = next
  listeners.forEach((listener) => listener())
}

/** 合併更新部分欄位。 */
export function patchAuthState(patch: Partial<AuthState>): void {
  setAuthState({ ...state, ...patch })
}

/** React hook：訂閱登入狀態。 */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getState)
}

const loadCloud = () => import('./cloud')

/** 應用程式啟動時呼叫：登入過的瀏覽器載入 Firebase 並恢復登入狀態。 */
export function initAuth(): void {
  if (state.status !== 'checking') return
  loadCloud()
    .then((cloud) => cloud.start())
    .catch((error) => {
      // 離線且瀏覽器沒快取到 Firebase 程式碼時會失敗：先顯示本機紀錄，
      // 這段期間的新紀錄存本機，下次登入成功時自動同步
      console.error('[auth] 載入登入模組失敗：', error)
      detachCloud()
      patchAuthState({ error: '無法連線到帳號服務，紀錄暫存在這台裝置' })
    })
}

/** 使用 Google 登入。失敗時丟出帶訊息的 Error。 */
export async function signIn(): Promise<void> {
  const cloud = await loadCloud()
  await cloud.signIn()
}

/** 登出。有尚未上傳的紀錄時丟出帶訊息的 Error。 */
export async function signOut(): Promise<void> {
  const cloud = await loadCloud()
  await cloud.signOut()
}
