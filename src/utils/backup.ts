/**
 * 測驗紀錄備份檔的匯出與匯入（設定頁與轉移教學頁共用）
 */
import { exportHistory, importHistory } from '@/data/historyStore'
import { showAlert } from '@/utils/dialog'

// iPhone / iPad（iPadOS 的 User-Agent 偽裝成 Mac，改用觸控點數判斷）
const isIOS =
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * 匯出備份檔。iOS 用分享選單（主畫面 App 無法直接下載檔案，
 * 使用者在選單點「儲存到檔案」），其他裝置直接下載。
 */
export async function downloadBackup(): Promise<void> {
  const file = new File(
    [exportHistory()],
    `practions-history-${new Date().toLocaleDateString('sv')}.json`,
    { type: 'application/json' },
  )
  if (isIOS && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (error) {
      // 使用者關閉分享選單
      if ((error as Error).name === 'AbortError') return
      console.warn('[backup] 分享失敗，改用下載：', error)
    }
  }
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

/** 匯入使用者選擇的備份檔，以彈窗顯示結果。 */
export async function importBackup(file: File): Promise<void> {
  try {
    const count = importHistory(await file.text())
    void showAlert(
      count > 0 ? `已匯入 ${count} 筆測驗紀錄` : '沒有新的測驗紀錄可匯入',
    )
  } catch (error) {
    void showAlert((error as Error).message, { title: '匯入失敗' })
  }
}
