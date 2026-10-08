import React from 'react'
import { Link } from 'react-router-dom'
import './Legal.scss'
import {
  TERMS_TITLE,
  TERMS_DESCRIPTION,
  PRIVACY_PATH,
  LEGAL_UPDATED,
  CONTACT_EMAIL,
} from './meta'
import { usePageMeta } from '@/hooks/usePageMeta'

/**
 * [page] Terms component
 * 使用條款：服務內容、非官方聲明、題庫來源與著作權、使用規範與免責
 */
function Terms(): React.ReactElement {
  usePageMeta(TERMS_TITLE, TERMS_DESCRIPTION)

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          使用條款
        </h1>
        <p>使用 Practions 即表示您同意以下條款，如果不同意，請停止使用。</p>
        <p className="legal-updated">最後更新：{LEGAL_UPDATED}</p>

        <div className="legal">
          <section>
            <h2>服務內容</h2>
            <p>
              Practions 是由 John Lin 個人開發、免費提供的 PVQC
              題庫練習工具。不登入就能使用；登入 Google
              帳號後，可以在不同裝置同步測驗紀錄。個人資料的處理方式請見
              <Link to={PRIVACY_PATH}>隱私權政策</Link>。
            </p>
          </section>

          <section>
            <h2>非官方服務</h2>
            <p>
              Practions 與 PVQC
              主辦單位及任何考試機構都沒有關係，練習成績也不代表正式考試的結果。
            </p>
          </section>

          <section>
            <h2>題庫內容</h2>
            <ul>
              <li>
                題庫由老師與同學提供。Practions
                會盡力確認內容正確，但不保證每一題的題目與答案都正確，或與正式考試一致。
              </li>
              <li>發現題目或答案有誤，歡迎來信回報。</li>
              <li>
                題目的著作權屬於原作者。如果您是權利人，並認為內容侵害了您的權利，請來信告知，我會盡快確認並處理。
              </li>
              <li>題庫只供個人學習練習，請勿用於商業用途。</li>
            </ul>
          </section>

          <section>
            <h2>帳號</h2>
            <p>
              Practions 使用 Google
              帳號登入，請自行保管好帳號安全。每個帳號只能存取自己的測驗紀錄。
            </p>
          </section>

          <section>
            <h2>使用規範</h2>
            <p>使用 Practions 時，請勿：</p>
            <ul>
              <li>攻擊、干擾或試圖破壞 Practions 的服務</li>
              <li>試圖存取其他使用者的資料</li>
              <li>使用自動化程式大量存取網站或下載題庫</li>
            </ul>
            <p>違反以上規範時，Practions 可以停止該帳號的使用。</p>
          </section>

          <section>
            <h2>服務變更與停止</h2>
            <p>
              Practions
              可能隨時調整功能，或暫停、停止服務。停止服務前會盡量提前公告，讓您有時間匯出您的資料。
            </p>
          </section>

          <section>
            <h2>免責聲明</h2>
            <p>
              Practions
              依現況提供，不保證服務不會中斷或沒有錯誤，建議定期匯出測驗紀錄備份。因使用
              Practions
              造成的損失，包括紀錄遺失、題目錯誤或考試結果，在法律允許的範圍內，Practions
              不負賠償責任。
            </p>
          </section>

          <section>
            <h2>條款更新</h2>
            <p>
              條款有變更時，會更新本頁上方的日期；變更後繼續使用
              Practions，即表示您同意更新後的條款。
            </p>
          </section>

          <section>
            <h2>準據法</h2>
            <p>本條款依中華民國法律解釋與適用。</p>
          </section>

          <section>
            <h2>聯絡方式</h2>
            <p>
              對這份條款有任何問題，請來信{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Terms
