import React, { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import './History.scss'

// types
import { HistoryRecord, STORAGE_KEYS } from '../../types'

/**
 * [page] History page
 * 歷史記錄列表頁面
 */
function History(): React.ReactElement {
  // 歷史記錄
  const [history, setHistory] = useState<HistoryRecord[]>([])

  /**
   * [function] useEffect
   * 獲取歷史記錄
   * @returns {void}
   */
  useEffect(() => {
    // 從 LocalStorage 中獲取歷史記錄
    const savedHistory = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY) || '[]'
    ) as HistoryRecord[]
    // 設定歷史記錄（反轉陣列）
    setHistory(savedHistory.reverse())
  }, [])

  return (
    <>
      <Outlet />
      <div className="page">
        <div className="page-container">
          <h1>
            <Link className="pre-path no-style" to="/quiz">
              測驗 /
            </Link>{' '}
            紀錄
          </h1>
          <div className="history-list">
            {history.length > 0 ? (
              <div className="history-section">
                {history.map((record) => {
                  // 安全檢查：確保 record 和 record.subject 存在
                  if (!record || !record.subject) {
                    console.warn('發現無效的歷史記錄:', record)
                    return null
                  }

                  const flowMode =
                    record.flowMode ||
                    (record.recordType === 'pvqc'
                      ? 'pvqc_custom'
                      : 'standard')
                  const modeLabel =
                    flowMode === 'pvqc_official'
                      ? 'PVQC 官方'
                      : flowMode === 'pvqc_custom'
                      ? 'PVQC 自訂'
                      : '標準'
                  // 官方模式：顯示 PASS / FAIL 徽章
                  const officialPassed =
                    flowMode === 'pvqc_official'
                      ? record.results?.overallPassed
                      : undefined

                  return (
                    <Link
                      key={record.id}
                      className="history-item no-style"
                      to={`/history/${record.id}`}
                    >
                      <div className="history-info">
                        <p className="history-subject">
                          {record.subject?.name || '未知測驗'}
                          <span className={`flow-mode-chip ${flowMode}`}>
                            {modeLabel}
                          </span>
                          {typeof officialPassed === 'boolean' && (
                            <span
                              className={`official-result-chip ${
                                officialPassed ? 'passed' : 'failed'
                              }`}
                            >
                              {officialPassed ? 'PASS' : 'FAIL'}
                            </span>
                          )}
                        </p>
                        <p>
                          #
                          {new Date(record.date)
                            .toLocaleString('zh-TW', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                            })
                            .replace(/[/-]/g, '')
                            .replace(/[\s:]/g, '')}
                        </p>
                        <p className="correct-rate">
                          {record.results?.overallCorrectRate ||
                            record.correctRate ||
                            '0%'}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="history-section">
                <p>尚無測驗紀錄</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default History
