import React from 'react'
import { Link } from 'react-router-dom'
import './Legal.scss'
import {
  PRIVACY_TITLE,
  PRIVACY_DESCRIPTION,
  LEGAL_UPDATED,
  CONTACT_EMAIL,
} from './meta'
import { usePageMeta } from '@/hooks/usePageMeta'

/**
 * [page] Privacy component
 * 隱私權政策：依個資法告知事項，說明收集的資料、用途、存放位置與使用者的權利
 */
function Privacy(): React.ReactElement {
  usePageMeta(PRIVACY_TITLE, PRIVACY_DESCRIPTION)

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          隱私權政策
        </h1>
        <p>
          Practions 是由 John Lin 個人開發、免費提供的 PVQC
          練習工具。這份政策說明 Practions
          會收集哪些資料、怎麼使用，以及您可以怎麼管理自己的資料。
        </p>
        <p className="legal-updated">最後更新：{LEGAL_UPDATED}</p>

        <div className="legal">
          <section>
            <h2>不登入也能使用</h2>
            <p>
              未登入時，測驗紀錄與設定只存在您這台裝置的瀏覽器裡，不會傳到任何伺服器。清除瀏覽器資料或刪除主畫面
              App 時，這些資料也會一起消失。
            </p>
          </section>

          <section>
            <h2>登入後收集的資料</h2>
            <p>使用 Google 帳號登入時，Practions 會取得並保存：</p>
            <ul>
              <li>
                Google 帳號的名稱、email 與大頭貼，由 Google
                提供，用來顯示您登入的是哪個帳號
              </li>
              <li>測驗紀錄，包括作答的題目與答案、分數和測驗時間</li>
            </ul>
            <p>
              Practions 不會取得您的 Google 密碼，也不會讀取
              Gmail、雲端硬碟等其他 Google 服務的內容。
            </p>
          </section>

          <section>
            <h2>資料的用途</h2>
            <p>
              這些資料只用來讓您在不同裝置看到同一份測驗紀錄。Practions
              不會把資料用於廣告，不會出售或提供給他人，也不會用來分析您的個人行為。
            </p>
          </section>

          <section>
            <h2>資料存放在哪裡</h2>
            <p>
              登入後的資料存放在 Google Firebase（Authentication 與 Cloud
              Firestore），伺服器位於台灣（asia-east1
              區域）。資料庫規則限定只有您本人登入後，才能讀取與修改自己的資料。
            </p>
            <p>Practions 使用以下第三方服務：</p>
            <ul>
              <li>Google Firebase：登入、資料儲存與網站託管</li>
              <li>Google Fonts：網站的字型與圖示</li>
            </ul>
            <p>
              使用這些服務時，Google 會依{' '}
              <a
                href="https://policies.google.com/privacy?hl=zh-TW"
                target="_blank"
                rel="noreferrer"
              >
                Google 隱私權政策
              </a>{' '}
              處理連線資訊，例如 IP 位址。
            </p>
          </section>

          <section>
            <h2>Cookie 與追蹤</h2>
            <p>
              Practions 沒有使用分析工具、廣告或追蹤用的
              Cookie。瀏覽器的儲存空間只用來保存您的設定、測驗紀錄與登入狀態。
            </p>
          </section>

          <section>
            <h2>保存期間</h2>
            <p>
              資料會保存到您自行刪除，或 Practions
              停止服務為止。停止服務前會提前公告，讓您有時間匯出您的資料。
            </p>
          </section>

          <section>
            <h2>您的權利</h2>
            <p>依照個人資料保護法，您可以隨時：</p>
            <ul>
              <li>查看：在「測驗紀錄」頁面查看所有紀錄</li>
              <li>匯出：到「設定」點「匯出測驗紀錄」，下載完整的備份檔</li>
              <li>
                刪除紀錄：到「設定」點「清除測驗紀錄」，登入時會一併刪除雲端上的紀錄
              </li>
              <li>
                刪除帳號：登入後到「設定」點「刪除帳號」，會永久刪除您在
                Practions
                的帳號與所有雲端測驗紀錄，這台裝置上的紀錄也會一併清除，刪除後無法復原。您的
                Google 帳號本身不受影響
              </li>
              <li>停止同步：登出後，新的測驗紀錄只會存在這台裝置</li>
            </ul>
          </section>

          <section>
            <h2>未成年使用者</h2>
            <p>
              Practions 的使用者多為學生。未滿 18
              歲的使用者，請在家長或監護人了解這份政策後再登入使用。
            </p>
          </section>

          <section>
            <h2>政策更新</h2>
            <p>
              政策有變更時，會更新本頁上方的日期；重大變更會另外在網站或更新紀錄中說明。
            </p>
          </section>

          <section>
            <h2>聯絡方式</h2>
            <p>
              對這份政策或您的資料有任何問題，請來信{' '}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>。
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Privacy
