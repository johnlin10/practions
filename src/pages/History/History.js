import React, { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import './History.scss'

function History() {
  const [history, setHistory] = useState([])

  useEffect(() => {
    const savedHistory = JSON.parse(
      localStorage.getItem('quizHistory-v3') || '[]'
    )
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
                {history.map((record, index) => (
                  <Link
                    key={history.length - index - 1}
                    className="history-item no-style"
                    to={`/history/${history.length - index - 1}`}
                  >
                    <div className="history-info">
                      <p className="history-subject">{record.subject.name}</p>
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
                      <p className="correct-rate">{record.correctRate}</p>
                    </div>
                  </Link>
                ))}
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
