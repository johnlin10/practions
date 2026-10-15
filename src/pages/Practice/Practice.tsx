import React from 'react'
import { Link } from 'react-router-dom'

// data
import { dueToday, useWrongQuestions } from '@/data/wrongQuestions'

/**
 * [page] Practice page
 * 練習：答一題就看到對錯的輕鬆練習，包含錯題複習
 */
function Practice(): React.ReactElement {
  // 錯題
  const wrongGroups = useWrongQuestions()
  // 今天可以複習的錯題（今天已經答對過的隔天再確認，含到期的回顧題）
  const dueGroups = dueToday(wrongGroups)

  return (
    <div className="page">
      <div className="page-container">
        {/* 標題列的樣式同測驗頁（Quiz.scss） */}
        <h1 className="quiz-to-history">
          練習
          <Link to="/practice/history" className="no-style">
            <p>紀錄</p>
            <span className="material-symbols-rounded">chevron_right</span>
          </Link>
        </h1>

        {/* 錯題複習入口 */}
        <Link className="review-entry no-style" to="/review">
          <span className="review-entry-icon material-symbols-rounded fill">
            replay
          </span>
          <span className="review-entry-title">錯題複習</span>
          <span className="review-entry-count">
            {dueGroups.length > 0 ? (
              <>
                <strong>
                  {dueGroups.reduce((sum, g) => sum + g.items.length, 0)}
                </strong>{' '}
                題待複習
              </>
            ) : wrongGroups.length > 0 ? (
              '今天的複習完成了'
            ) : (
              '目前沒有錯題'
            )}
          </span>
          <span className="review-entry-arrow material-symbols-rounded">
            chevron_right
          </span>
        </Link>
      </div>
    </div>
  )
}

export default Practice
