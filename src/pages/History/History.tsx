import React from 'react'
import { Link, Outlet } from 'react-router-dom'
import './History.scss'

// data
import { useQuizHistory } from '@/hooks/useQuizHistory'

/**
 * [page] History page
 * 歷史記錄列表頁面
 */
function History(): React.ReactElement {
  // 歷史記錄（由資料層提供）；複製後依時間新到舊排序，以免 mutate 唯讀快照
  const { history: rawHistory } = useQuizHistory()
  const history = [...rawHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // 依日期分組，同一天的紀錄放在同一個列表
  const days: { date: string; records: typeof history }[] = []
  for (const record of history) {
    // 安全檢查：確保 record 和 record.subject 存在
    if (!record || !record.subject) {
      console.warn('發現無效的歷史記錄:', record)
      continue
    }
    // 例：2026年9月26日 週六
    const recordDate = new Date(record.date)
    const date = `${recordDate.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })} ${recordDate.toLocaleDateString('zh-TW', { weekday: 'short' })}`
    const day = days[days.length - 1]
    if (day?.date === date) day.records.push(record)
    else days.push({ date, records: [record] })
  }

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
            {days.length > 0 ? (
              days.map(({ date, records }) => (
                <div
                  key={date}
                  className="history-section history-day has-title"
                >
                  <h5>{date}</h5>
                  {records.map((record) => {
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
              ))
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
