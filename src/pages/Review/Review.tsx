import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Review.scss'

// components
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'

// data
import {
  buildReviewFlow,
  countByKind,
  useWrongQuestions,
} from '@/data/wrongQuestions'
import { useHistoryReady } from '@/data/historyStore'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import { REVIEW_LIMITS } from '@/types/settings'

const limitOptions = REVIEW_LIMITS.map((n) => ({
  value: String(n),
  label: String(n),
}))

/**
 * [page] Review page
 * 錯題複習：依科目列出待複習的錯題，一次複習一個科目
 */
function Review(): React.ReactElement {
  const navigate = useNavigate()
  const groups = useWrongQuestions()
  // 登入中的雲端紀錄尚未到達時不閃出「目前沒有錯題」
  const ready = useHistoryReady()
  // 每次複習題數（記在本機設定）
  const limit = useSettingsStore().reviewLimit

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/quiz">
            測驗 /
          </Link>{' '}
          錯題複習
        </h1>

        {!ready ? null : groups.length > 0 ? (
          <>
            <div className="review-limit">
              <span>每次複習題數</span>
              <SegmentedControl
                label="每次複習題數"
                value={String(limit)}
                onChange={(value) =>
                  updateSettings({ reviewLimit: Number(value) })
                }
                options={limitOptions}
              />
            </div>
            <div className="review-list">
              {groups.map((group) => {
                return (
                  <div key={group.subject.id} className="review-card">
                    <div className="review-card-header">
                      <p className="review-subject">{group.subject.name}</p>
                      <p className="review-count">
                        <strong>{group.items.length}</strong> 題
                      </p>
                    </div>
                    <div className="review-card-body">
                      <div className="review-types">
                        {countByKind(group.items).map(([label, n]) => (
                          <span key={label}>
                            {label} {n}
                          </span>
                        ))}
                      </div>
                      <button
                        className="review-start-btn"
                        onClick={() =>
                          navigate(`/quiz/${group.subject.id}`, {
                            state: {
                              customFlowConfig: buildReviewFlow(group, limit),
                            },
                          })
                        }
                      >
                        開始
                        <span className="material-symbols-rounded">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="review-empty">
            <span className="review-empty-icon material-symbols-rounded">
              check
            </span>
            <p>目前沒有錯題</p>
            <Link className="review-empty-btn no-style" to="/quiz">
              去做測驗
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Review
