import React, { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Transfer.scss'
import { useQuizHistory } from '@/hooks/useQuizHistory'
import { downloadBackup, importBackup } from '@/utils/backup'

/**
 * [page] Transfer component
 * 教學頁面：把測驗紀錄從舊網址（practions.web.app）或舊手機轉移到新的 Practions
 * 舊網址與 practions.app 的紀錄分開保存，主畫面 App 也與瀏覽器分開，只能用備份檔搬
 */
function Transfer(): React.ReactElement {
  const navigate = useNavigate()
  const { history } = useQuizHistory()
  const importInputRef = useRef<HTMLInputElement>(null)

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    // 清空讓同一個檔案可以再選一次
    e.target.value = ''
    if (file) void importBackup(file)
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          轉移測驗紀錄
        </h1>
        <p>
          Practions 的網址已改為 practions.app。測驗紀錄存在各自的網址與 App
          裡，不會自動搬過去，請依照以下步驟轉移；換新手機時也是一樣的做法。
        </p>

        <ol className="transfer-steps">
          <li>
            <h3>在舊的 Practions 匯出紀錄</h3>
            <p>
              開啟原本使用的 Practions（舊的主畫面 App 或
              practions.web.app），到「設定」點「匯出測驗紀錄」。iPhone
              會跳出分享選單，請點「儲存到檔案」。
            </p>
            <button
              className="transfer-button primary"
              disabled={history.length === 0}
              onClick={() => void downloadBackup()}
            >
              <span className="material-symbols-outlined">download</span>
              {history.length > 0
                ? `匯出 ${history.length} 筆測驗紀錄`
                : '這裡沒有測驗紀錄'}
            </button>
          </li>
          <li>
            <h3>安裝新的 Practions</h3>
            <p>
              用 Safari（Android 用 Chrome）開啟 practions.app，加入主畫面。
            </p>
            <button
              className="transfer-button"
              onClick={() => navigate('/settings/install')}
            >
              <span className="material-symbols-outlined">
                add_to_home_screen
              </span>
              查看加入主畫面教學
            </button>
          </li>
          <li>
            <h3>在新的 Practions 匯入紀錄</h3>
            <p>
              從主畫面開啟新的
              Practions，到「設定」點「匯入測驗紀錄」，選擇剛剛儲存的備份檔。已經有的紀錄不會重複匯入。
            </p>
            <input
              ref={importInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={handleImportFile}
            />
            <button
              className="transfer-button"
              onClick={() => importInputRef.current?.click()}
            >
              <span className="material-symbols-outlined">upload</span>
              匯入測驗紀錄
            </button>
          </li>
          <li>
            <h3>刪除舊的 App</h3>
            <p>
              確認紀錄都出現在新的 Practions 之後，就可以把舊的主畫面圖示刪除。
            </p>
          </li>
        </ol>

        <p className="transfer-note">
          <span className="material-symbols-rounded">cloud_sync</span>在
          practions.app 登入 Google
          帳號後，測驗紀錄會自動同步到雲端，之後換手機登入就能看到，不用再手動轉移。
        </p>
      </div>
    </div>
  )
}

export default Transfer
