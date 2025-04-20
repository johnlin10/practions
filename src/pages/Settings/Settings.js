import './Settings.scss'

function Settings() {
  const history = JSON.parse(localStorage.getItem('quizHistory-v3') || '[]')
  const hasHistory = history.length > 0

  const clearHistory = () => {
    if (window.confirm(`確定要清除 ${history.length} 筆測驗紀錄嗎？`)) {
      localStorage.setItem('quizHistory-v3', JSON.stringify([]))
      window.location.reload()
    }
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>設定</h1>

        <div className="settings-list">
          <div className="settings-list-group has-title">
            <h5>測驗</h5>
            <div
              className={`settings-list-group-item action ${
                !hasHistory ? 'disabled' : ''
              }`}
              onClick={() => {
                if (!hasHistory) return
                clearHistory()
              }}
            >
              <p>
                <span class="material-symbols-outlined icon">delete</span>
                清除測驗紀錄
              </p>
              {!hasHistory ? (
                <p className="info">沒有測驗紀錄</p>
              ) : (
                <p className="info">{history.length} 筆紀錄</p>
              )}
            </div>
          </div>

          <div className="settings-list-group has-title">
            <h5>開發資訊</h5>
            <div className="settings-list-group-item">
              <p>版本</p>
              <p className="info">v1.1.6</p>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => {
                window.open('https://github.com/johnlin10/practions', '_blank')
              }}
            >
              <p>開放原始碼</p>
              <span class="material-symbols-rounded icon">arrow_outward</span>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => {
                window.open('https://github.com/johnlin10', '_blank')
              }}
            >
              <p>開發者</p>
              <p className="info">John Lin</p>
            </div>
            <div
              className="settings-list-group-item action"
              onClick={() => {
                window.open('mailto:johnlin@johnlin.me', '_blank')
              }}
            >
              <p>聯絡方式</p>
              <p className="info">johnlin@johnlin.me</p>
            </div>
          </div>
        </div>

        {/* 開發者資訊 */}
        {/* <div className="developer-info">
          <p>版本：1.1.0</p>
          <p>
            開放原始碼：
            <a
              href="https://github.com/johnlin10/practions"
              className="no-style"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/johnlin10/practions
            </a>
          </p>
          <p>
            開發者：
            <a
              href="https://github.com/johnlin10"
              className="no-style"
              target="_blank"
              rel="noopener noreferrer"
            >
              John Lin
            </a>
          </p>
          <p>
            聯絡方式：
            <a
              href="mailto:johnlin@johnlin.me"
              className="no-style"
              target="_blank"
              rel="noopener noreferrer"
            >
              johnlin@johnlin.me
            </a>
          </p>
        </div> */}

        <div className="copyright">
          <p>© 2025 Practions. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
