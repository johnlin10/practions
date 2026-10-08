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
  getAuth,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  clearIndexedDbPersistence,
  collection,
  doc,
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

// 單次批次上限 500 筆、10 MiB；一筆紀錄可能數十 KB，保守分批
const BATCH_SIZE = 100

let unsubscribe: Unsubscribe | null = null
let started = false

function recordsOf(uid: string) {
  return collection(db, 'users', uid, 'records')
}

function sinkFor(uid: string): CloudSink {
  const inBatches = async <T>(
    items: T[],
    apply: (batch: ReturnType<typeof writeBatch>, item: T) => void,
  ): Promise<void> => {
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = writeBatch(db)
      items.slice(i, i + BATCH_SIZE).forEach((item) => apply(batch, item))
      await batch.commit()
    }
  }
  return {
    save: (entries: CloudEntry[]) =>
      inBatches(entries, (batch, { id, date, data }) =>
        batch.set(doc(recordsOf(uid), id), { date, data }),
      ),
    remove: (ids: string[]) =>
      inBatches(ids, (batch, id) => batch.delete(doc(recordsOf(uid), id))),
  }
}

/** 登入後把本機紀錄併入雲端；失敗時保留本機存檔，下次登入再試。 */
async function syncLocal(): Promise<void> {
  try {
    const count = await syncLocalToCloud()
    if (count > 0) patchAuthState({ synced: count })
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

  onAuthStateChanged(auth, (user) => {
    unsubscribe?.()
    unsubscribe = null

    if (!user) {
      remove(STORAGE_KEYS.SIGNED_IN)
      detachCloud()
      setAuthState({ status: 'guest' })
      return
    }

    write(STORAGE_KEYS.SIGNED_IN, true)
    setAuthState({
      status: 'signed-in',
      email: user.email ?? '',
    })
    attachCloud(sinkFor(user.uid))

    let first = true
    unsubscribe = onSnapshot(
      query(recordsOf(user.uid), orderBy('date')),
      (snapshot) => {
        receiveCloud(snapshot.docs.map((d) => d.get('data') as string))
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

/** 使用 Google 登入：一般瀏覽器用彈出視窗，主畫面 App 用整頁導向。 */
export async function signIn(): Promise<void> {
  start()
  const provider = new GoogleAuthProvider()
  // 主畫面 App（standalone）的彈出視窗回不到 App
  const standalone =
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as { standalone?: boolean }).standalone === true
  const redirect = (): Promise<never> => {
    // 導向回來時才會載入 Firebase 接手登入結果；取消登入時會在 start() 清掉
    write(STORAGE_KEYS.SIGNED_IN, true)
    return signInWithRedirect(auth, provider)
  }
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
    throw Object.assign(new Error('登入失敗，請再試一次'), { cause: error })
  }
}

/** 登出並清除這個瀏覽器的雲端快取，共用電腦的下一位使用者看不到紀錄。 */
export async function signOut(): Promise<void> {
  // 尚未上傳的紀錄會隨快取一起清掉，先確認都送出了
  const timeout = new Promise<'timeout'>((resolve) =>
    setTimeout(() => resolve('timeout'), 5000),
  )
  if ((await Promise.race([waitForPendingWrites(db), timeout])) === 'timeout') {
    throw new Error('還有紀錄尚未上傳到雲端，請連上網路後再登出')
  }
  unsubscribe?.()
  unsubscribe = null
  await firebaseSignOut(auth)
  await terminate(db)
  // ponytail: 其他分頁開著時無法清除快取，資料仍受登入規則保護；要徹底清除需關閉其他分頁
  await clearIndexedDbPersistence(db).catch(() => {})
  // 重新整理以重建 Firestore（terminate 後無法再使用）
  location.reload()
}
