import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../Settings/Settings.scss'
import './Changelog.scss'

const changelog = __CHANGELOG__

/**
 * [page] Changelog component
 * 更新紀錄：列出 git 中 v*.*.* 開頭的提交（新到舊）
 * 最新一則完整顯示；其餘預設收合，同時只展開一則
 */
function Changelog(): React.ReactElement {
  const [expanded, setExpanded] = useState<string | null>(null)

  const toggle = (hash: string, el: HTMLElement): void => {
    setExpanded((current) => (current === hash ? null : hash))
    // 上方展開的紀錄收合後，點擊的這則可能被推出畫面，捲回可見範圍
    requestAnimationFrame(() =>
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }),
    )
  }

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          更新紀錄
        </h1>

        <div className="settings-list">
          <div className="settings-list-group changelog">
            {changelog.map((entry, index) => {
              const latest = index === 0
              const open = latest || expanded === entry.hash
              return (
                <div
                  key={entry.hash}
                  className={`settings-list-group-item changelog-entry${
                    latest ? '' : ' action'
                  }${open ? ' open' : ''}`}
                  {...(!latest && {
                    role: 'button',
                    tabIndex: 0,
                    'aria-expanded': open,
                    onClick: (e: React.MouseEvent<HTMLDivElement>) =>
                      toggle(entry.hash, e.currentTarget),
                    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      toggle(entry.hash, e.currentTarget)
                    },
                  })}
                >
                  <div className="changelog-header">
                    <p className="changelog-version">{entry.version}</p>
                    <p className="info">{entry.date}</p>
                  </div>
                  <p className="changelog-title">{entry.title}</p>
                  {entry.body && <p className="changelog-body">{entry.body}</p>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Changelog
