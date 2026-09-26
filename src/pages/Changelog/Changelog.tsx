import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import '../Settings/Settings.scss'
import './Changelog.scss'

// 最新一則為「目前版本」，其餘為「歷史版本」
const [current, ...history] = __CHANGELOG__

/**
 * [function] entryContent
 * 單則更新紀錄的內容：版本號、日期、標題與更新內容
 */
function entryContent(entry: ChangelogEntry): React.ReactElement {
  return (
    <>
      <div className="changelog-header">
        <p className="changelog-version">{entry.version}</p>
        <p className="info">{entry.date}</p>
      </div>
      <p className="changelog-title">{entry.title}</p>
      {entry.body && <p className="changelog-body">{entry.body}</p>}
    </>
  )
}

/**
 * [page] Changelog component
 * 更新紀錄：列出 git 中 v*.*.* 開頭的提交（新到舊）
 * 目前版本完整顯示；歷史版本預設收合，同時只展開一則
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
          {current && (
            <div className="settings-list-group has-title changelog">
              <h5>目前版本</h5>
              <div className="settings-list-group-item changelog-entry open">
                {entryContent(current)}
              </div>
            </div>
          )}

          {history.length > 0 && (
            <div className="settings-list-group has-title changelog">
              <h5>歷史版本</h5>
              {history.map((entry) => {
                const open = expanded === entry.hash
                return (
                  <div
                    key={entry.hash}
                    className={`settings-list-group-item changelog-entry collapsible${
                      open ? ' open' : ''
                    }`}
                    role="button"
                    tabIndex={0}
                    aria-expanded={open}
                    onClick={(e) => toggle(entry.hash, e.currentTarget)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' && e.key !== ' ') return
                      e.preventDefault()
                      toggle(entry.hash, e.currentTarget)
                    }}
                  >
                    {entryContent(entry)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Changelog
