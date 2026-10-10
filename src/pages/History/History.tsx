import React, { useRef, useState } from 'react'
import { Link, useOutlet } from 'react-router-dom'
import './History.scss'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'

// data
import { useQuizHistory } from '@/hooks/useQuizHistory'
import { useHistoryReady } from '@/data/historyStore'
import { reviewSummary } from '@/data/wrongQuestions'
import { useAuth } from '@/data/authStore'
import { showConfirm } from '@/utils/dialog'

/**
 * [page] History page
 * 歷史記錄列表頁面
 */
function History(): React.ReactElement {
  // 歷史記錄（由資料層提供）；複製後依時間新到舊排序，以免 mutate 唯讀快照
  const { history: rawHistory, deleteRecord } = useQuizHistory()
  const signedIn = useAuth().status === 'signed-in'
  // 登入中的雲端紀錄尚未到達時顯示載入中，不閃出「尚無測驗紀錄」
  const ready = useHistoryReady()
  // 開啟單筆紀錄時只顯示詳情頁（整頁捲動，不疊在列表上）
  const outlet = useOutlet()
  // 篩選：全部 / 一般測驗 / 錯題複習
  const [filter, setFilter] = useState<'all' | 'quiz' | 'review'>('all')
  const history = rawHistory
    .filter(
      (record) =>
        filter === 'all' ||
        (record.flowMode === 'review') === (filter === 'review'),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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

  // 一次只開一列：某一列滑開時，把原本滑開的那列滑回去
  // 看各列自己的 scroll，手指、觸控板、鍵盤都適用；滑回去的動畫也會觸發 scroll，要略過
  const openRow = useRef<HTMLDivElement | null>(null)
  const closingRows = useRef(new Set<HTMLDivElement>())
  const handleRowScroll = (event: React.UIEvent<HTMLDivElement>): void => {
    const row = event.currentTarget
    if (row.scrollLeft === 0) {
      closingRows.current.delete(row)
      if (openRow.current === row) openRow.current = null
      return
    }
    if (openRow.current === row || closingRows.current.has(row)) return
    const previous = openRow.current
    openRow.current = row
    if (previous?.isConnected) {
      closingRows.current.add(previous)
      previous.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }

  // 左滑後按刪除：確認後刪除，取消就把這一列滑回去
  const confirmDelete = async (
    event: React.MouseEvent<HTMLButtonElement>,
    id: string,
    label: string,
  ): Promise<void> => {
    const row = event.currentTarget.parentElement
    const ok = await showConfirm(
      `${label}\n${
        signedIn
          ? '雲端與所有裝置上的這筆紀錄都會一併刪除，且無法復原。'
          : '刪除後無法復原。'
      }`,
      { title: '確定要刪除這筆紀錄嗎？', confirmText: '刪除', danger: true },
    )
    if (ok) deleteRecord(id)
    else row?.scrollTo({ left: 0, behavior: 'smooth' })
  }

  if (outlet) return outlet

  return (
    <>
      <div className="page">
        <div className="page-container">
          <h1 className="history-title">
            <span>
              <Link className="pre-path no-style" to="/quiz">
                測驗 /
              </Link>{' '}
              紀錄
            </span>
            {/* 篩選：跟著標題固定在頂部 */}
            {rawHistory.length > 0 && (
              <SegmentedControl
                label="篩選紀錄"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: 'all', label: '全部' },
                  { value: 'quiz', label: '測驗' },
                  { value: 'review', label: '複習' },
                ]}
              />
            )}
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
                      flowMode === 'review'
                        ? '錯題複習'
                        : flowMode === 'pvqc_official'
                          ? 'PVQC 官方'
                          : flowMode === 'pvqc_custom'
                            ? 'PVQC 自訂'
                            : '標準'
                    // 錯題複習：顯示答對的題數（含再練答對），不顯示正確率
                    const review = reviewSummary(record)
                    // 官方模擬：顯示通過與否
                    const officialPassed =
                      flowMode === 'pvqc_official'
                        ? record.results?.overallPassed
                        : undefined

                    return (
                      <div
                        key={record.id}
                        className="history-swipe"
                        onScroll={handleRowScroll}
                      >
                        <Link
                          className="history-item no-style"
                          to={`/history/${record.id}`}
                          viewTransition
                        >
                          <div className="history-info">
                            <p className="history-subject">
                              {record.subject?.name || '未知測驗'}
                            </p>
                            <p>
                              <span
                                className={
                                  flowMode === 'review'
                                    ? 'review-label'
                                    : undefined
                                }
                              >
                                {modeLabel}
                              </span>{' '}
                              · #
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
                              {typeof officialPassed === 'boolean' && (
                                <>
                                  {' · '}
                                  <span
                                    className={`official-result ${
                                      officialPassed ? 'passed' : 'failed'
                                    }`}
                                  >
                                    {officialPassed ? '通過' : '未通過'}
                                  </span>
                                </>
                              )}
                            </p>
                            <p className="correct-rate">
                              {review
                                ? `${review.first + review.retry}/${review.total}`
                                : record.results?.overallCorrectRate ||
                                  record.correctRate ||
                                  '0%'}
                            </p>
                          </div>
                        </Link>
                        <button
                          className="delete-btn"
                          aria-label="刪除這筆紀錄"
                          onClick={(event) =>
                            void confirmDelete(
                              event,
                              record.id,
                              `${record.subject?.name || '未知測驗'} · ${modeLabel}`,
                            )
                          }
                        >
                          <span
                            className="material-symbols-rounded"
                            aria-hidden="true"
                          >
                            delete
                          </span>
                          刪除
                        </button>
                      </div>
                    )
                  })}
                </div>
              ))
            ) : (
              <div className="history-section">
                <p>
                  {!ready
                    ? '正在載入測驗紀錄…'
                    : filter === 'review'
                      ? '尚無錯題複習紀錄'
                      : '尚無測驗紀錄'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default History
