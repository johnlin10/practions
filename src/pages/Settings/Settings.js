import './Settings.scss'

function Settings() {
  return (
    <div className="page">
      <div className="page-container">
        <h1>設定</h1>

        <div className="settings-list">
          <div className="settings-list-group">
            <div className="settings-list-group-item">
              <p>這裡還沒有東西呢！</p>
            </div>
            <div className="settings-list-group-item">
              <p></p>
            </div>
            <div className="settings-list-group-item">
              <p></p>
            </div>
          </div>
          {/* <div className="settings-list-group">
            <div className="settings-list-group-item">
              <p></p>
            </div>
            <div className="settings-list-group-item">
              <p></p>
            </div>
            <div className="settings-list-group-item">
              <p></p>
            </div>
          </div> */}
        </div>

        {/* 開發者資訊 */}
        <div className="developer-info">
          <p>版本：1.0.3</p>
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
        </div>

        <div className="copyright">
          <p>© 2025 Practions. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
