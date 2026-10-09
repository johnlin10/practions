/**
 * Firebase 登入與雲端紀錄（動態載入，只在登入過或按下登入時才下載）
 *
 * 紀錄存在 users/{uid}/records/{recordId}，資料仍由 historyStore 管理，
 * 這裡只負責登入狀態，以及把 Firestore 接成 historyStore 的 CloudSink。
 * Firestore 開啟 IndexedDB 離線快取：離線也能讀，交卷的寫入會排隊到上線後送出。
 */
import { initializeApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  deleteUser,
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  collection,
  doc,
  getDocsFromServer,
  initializeFirestore,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  terminate,
  waitForPendingWrites,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { STORAGE_KEYS } from '@/types'
import { remove, write } from '@/utils/storage'
import {
  attachCloud,
  detachCloud,
  receiveCloud,
  syncLocalToCloud,
  type CloudEntry,
  type CloudSink,
} from './historyStore'
import { patchAuthState, setAuthState } from './authStore'

const app = initializeApp({
  apiKey: 'AIzaSyBomeNW605CZk-RN7LSQ7krjNfPUXaiLGo',
  // 部署後用目前網域：登入流程同源，Safari 擋第三方儲存時整頁導向登入才能運作
  // （Firebase Hosting 在每個網域都提供 /__/auth/handler）
  authDomain:
    location.hostname === 'localhost'
      ? 'practions-22f27.firebaseapp.com'
      : location.host,
  projectId: 'practions-22f27',
  appId: '1:980630113104:web:f9c23048e14dc032b9ba55',
})
const auth = getAuth(app)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// 單次批次上限 500 筆；刪除只有 id，以筆數分批（寫入由 historyStore 依大小分好批）
const BATCH_SIZE = 100

let unsubscribe: Unsubscribe | null = null
let started = false
// 正在整頁導向登入：Firebase 啟動時回報的「未登入」不能清掉導向前寫入的旗標
let redirecting = false
// 最近一次雲端快照的狀態：fromCache 表示資料還沒跟伺服器確認過
let lastMeta = { fromCache: true, hasPendingWrites: false }

/** 依快照狀態與網路狀態更新同步狀態。 */
function updateSync(): void {
  if (!unsubscribe) return
  const { fromCache, hasPendingWrites } = lastMeta
  if (!navigator.onLine) patchAuthState({ sync: 'offline' })
  // 還沒跟伺服器確認過（剛開啟、正在重新連線）或有紀錄在上傳
  else if (fromCache || hasPendingWrites) patchAuthState({ sync: 'syncing' })
  else patchAuthState({ sync: 'synced' })
}

function recordsOf(uid: string) {
  return collection(db, 'users', uid, 'records')
}

function sinkFor(uid: string): CloudSink {
  return {
    save: (entries: CloudEntry[]) => {
      const batch = writeBatch(db)
      entries.forEach(({ id, date, data }) =>
        batch.set(doc(recordsOf(uid), id), { date, data }),
      )
      return batch.commit()
    },
    remove: async (ids: string[]) => {
      const commits: Promise<void>[] = []
      for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = writeBatch(db)
        ids
          .slice(i, i + BATCH_SIZE)
          .forEach((id) => batch.delete(doc(recordsOf(uid), id)))
        commits.push(batch.commit())
      }
      await Promise.all(commits)
    },
  }
}

/** 登入後把本機紀錄併入雲端；失敗時保留本機存檔，下次開啟再試。 */
async function syncLocal(): Promise<void> {
  try {
    await syncLocalToCloud()
  } catch (error) {
    console.error('[cloud] 本機紀錄同步失敗，保留本機存檔：', error)
  }
}

/** 開始監聽登入狀態（可重複呼叫）。 */
export function start(): void {
  if (started) return
  started = true

  getRedirectResult(auth).catch((error) => {
    console.error('[cloud] 導向登入失敗：', error)
    patchAuthState({ error: '登入失敗，請再試一次' })
  })

  // 網路斷線或恢復時 Firestore 不一定立刻通知，自己再更新一次
  window.addEventListener('online', updateSync)
  window.addEventListener('offline', updateSync)

  onAuthStateChanged(auth, (user) => {
    unsubscribe?.()
    unsubscribe = null

    if (!user) {
      if (!redirecting) remove(STORAGE_KEYS.SIGNED_IN)
      detachCloud()
      setAuthState({ status: 'guest' })
      return
    }

    write(STORAGE_KEYS.SIGNED_IN, true)
    setAuthState({
      status: 'signed-in',
      email: user.email ?? '',
      photoURL: user.photoURL ?? undefined,
      sync: navigator.onLine ? 'syncing' : 'offline',
    })
    attachCloud(sinkFor(user.uid))

    let first = true
    unsubscribe = onSnapshot(
      query(recordsOf(user.uid), orderBy('date')),
      // 含 metadata 變化：寫入被伺服器確認時也會通知，用來顯示同步狀態
      { includeMetadataChanges: true },
      (snapshot) => {
        receiveCloud(snapshot.docs.map((d) => d.get('data') as string))
        lastMeta = snapshot.metadata
        updateSync()
        if (first) {
          first = false
          void syncLocal()
        }
      },
      (error) => {
        // 讀不到雲端時改回本機，這段期間的新紀錄下次登入會同步
        console.error('[cloud] 讀取雲端紀錄失敗：', error)
        detachCloud()
        patchAuthState({ error: '無法讀取雲端紀錄，紀錄暫存在這台裝置' })
      },
    )
  })
}

// 主畫面 App（standalone）的彈出視窗回不到 App
function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * 登入失敗的訊息。Firebase 登入前會檢查網域是否已授權，並記住第一次的結果（含失敗）：
 * 連線失敗後，就算恢復網路，之後每次登入都會失敗，要重新開啟頁面才會再檢查。
 */
function signInError(error: unknown): Error {
  const network =
    (error as { code?: string }).code === 'auth/network-request-failed'
  return Object.assign(
    new Error(
      network
        ? '無法連線到 Google，請確認網路後重新開啟 App 再登入'
        : '登入失敗，請再試一次',
    ),
    { cause: error },
  )
}

/** 使用 Google 登入：一般瀏覽器用彈出視窗，主畫面 App 用整頁導向。 */
export async function signIn(): Promise<void> {
  start()
  const provider = new GoogleAuthProvider()
  const standalone = isStandalone()
  const redirect = async (): Promise<void> => {
    // 導向回來時才會載入 Firebase 接手登入結果；取消登入時會在 start() 清掉
    redirecting = true
    write(STORAGE_KEYS.SIGNED_IN, true)
    try {
      await signInWithRedirect(auth, provider)
    } catch (error) {
      redirecting = false
      remove(STORAGE_KEYS.SIGNED_IN)
      console.error('[cloud] 登入失敗：', error)
      throw signInError(error)
    }
  }
  // 已經是登入狀態（例如導向登入剛完成）就不再登入一次
  await auth.authStateReady()
  if (auth.currentUser) return
  if (standalone) return redirect()
  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === 'auth/popup-blocked') return redirect()
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request'
    )
      return
    console.error('[cloud] 登入失敗：', error)
    throw signInError(error)
  }
}

/** 等尚未上傳的紀錄送出；5 秒內送不完就丟出錯誤。 */
async function flushPendingWrites(message: string): Promise<void> {
  const timeout = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), 5000),
  )
  if ((await Promise.race([waitForPendingWrites(db), timeout])) === 'timeout') {
    throw new Error(message)
  }
}

/** 清除這個瀏覽器的雲端快取並重新整理（terminate 後 Firestore 無法再使用）。 */
async function resetAndReload(): Promise<void> {
  await terminate(db)
  // ponytail: 其他分頁開著時無法清除快取，資料仍受登入規則保護；要徹底清除需關閉其他分頁
  await clearIndexedDbPersistence(db).catch(() => {})
  location.reload()
}

/** 登出並清除這個瀏覽器的雲端快取，共用電腦的下一位使用者看不到紀錄。 */
export async function signOut(): Promise<void> {
  // 尚未上傳的紀錄會隨快取一起清掉，先確認都送出了
  await flushPendingWrites('還有紀錄尚未上傳到雲端，請連上網路後再登出')
  unsubscribe?.()
  unsubscribe = null
  await firebaseSignOut(auth)
  await resetAndReload()
}

// Firebase 刪除帳號要求最近登入過（約 5 分鐘內）
const RECENT_LOGIN_MS = 5 * 60 * 1000

/**
 * 刪除帳號：雲端紀錄、Firebase 帳號、這台裝置上的紀錄全部清除，完成後重新整理。
 * 先確認身分再刪除，避免紀錄刪了帳號卻刪不掉。使用者取消確認身分時回傳 false。
 */
export async function deleteAccount(): Promise<boolean> {
  const user = auth.currentUser
  if (!user) throw new Error('請先登入')
  if (!navigator.onLine) throw new Error('請連上網路後再刪除帳號')

  const lastSignIn = Date.parse(user.metadata.lastSignInTime ?? '')
  if (!(Date.now() - lastSignIn < RECENT_LOGIN_MS)) {
    // ponytail: 主畫面 App 無法用彈出視窗確認身分，請使用者重新登入；要免重登需改用導向並在回來後接續刪除
    if (isStandalone()) {
      throw new Error(
        '為了確認是您本人，請先登出再重新登入，然後在 5 分鐘內刪除帳號。',
      )
    }
    try {
      await reauthenticateWithPopup(user, new GoogleAuthProvider())
    } catch (error) {
      const code = (error as { code?: string }).code
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      )
        return false
      if (code === 'auth/user-mismatch')
        throw Object.assign(new Error('請選擇目前登入的 Google 帳號'), {
          cause: error,
        })
      console.error('[cloud] 確認身分失敗：', error)
      throw Object.assign(new Error('無法確認身分，請再試一次'), {
        cause: error,
      })
    }
  }

  try {
    // 排隊中的寫入先送出，再以伺服器上的資料為準刪除全部紀錄
    await flushPendingWrites('還有紀錄尚未上傳，請確認網路連線後再試一次')
    const snapshot = await getDocsFromServer(recordsOf(user.uid))
    await sinkFor(user.uid).remove(snapshot.docs.map((d) => d.id))
    unsubscribe?.()
    unsubscribe = null
    await deleteUser(user)
  } catch (error) {
    console.error('[cloud] 刪除帳號失敗：', error)
    throw Object.assign(new Error('刪除帳號失敗，請再試一次'), { cause: error })
  }

  remove(STORAGE_KEYS.QUIZ_HISTORY)
  remove(STORAGE_KEYS.QUESTION_SNAPSHOTS)
  remove(STORAGE_KEYS.SIGNED_IN)
  await resetAndReload()
  return true
}
