import React, { useEffect, useState } from 'react'
import { useParams, Link, Outlet } from 'react-router-dom'
import './Bank.scss'

// data
import { subjects } from '../../data/subjects'

// utils
import {
  isSubjectLocked,
  getLockStatus,
  formatLockTime,
} from './utils/bankHelpers'

// types
import { SubjectConfig } from '../../types/quiz-flows'

interface BankParams extends Record<string, string | undefined> {
  subjectId?: string
}

/**
 * [page] Bank page
 * 題庫頁面，顯示所有可用的科目
 */
function Bank(): React.ReactElement {
  // 取得科目 ID
  const { subjectId } = useParams<BankParams>()
  // 選中的科目
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  // 當前時間
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  // 更新當前時間
  useEffect(() => {
    // 設置當前時間
    setCurrentTime(new Date())
    // 每 10 秒更新一次當前時間
    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)
    // 清除定時器
    return () => clearInterval(intervalId)
  }, [])

  // 更新選中的科目
  useEffect(() => {
    if (subjectId) {
      setSelectedSubject(subjectId)
    }
  }, [subjectId])

  return (
    <>
      <Outlet />
      <div className="page">
        <div className="page-container">
          <h1>題庫</h1>
          <div className="subjects-section">
            <div className="subjects-grid">
              {Object.values(subjects).map((subject: SubjectConfig) => {
                const locked = isSubjectLocked(subject)
                const lockStatus = getLockStatus(subject, currentTime)
                return (
                  <Link
                    key={subject.id}
                    className={`subject-card no-style${
                      selectedSubject === subject.id ? ' selected' : ''
                    }${locked ? ' locked' : ''}`}
                    to={locked ? '' : `/bank/${subject.id}`}
                  >
                    <p className="subject-name">
                      {locked && (
                        <span className="material-symbols-rounded">lock</span>
                      )}
                      {subject.name}
                    </p>

                    <p>
                      {subject.lockTime && lockStatus.status !== 'none' && (
                        <span className={`lock-time ${locked ? 'locked' : ''}`}>
                          {lockStatus.text}{' '}
                          {lockStatus.time && formatLockTime(lockStatus.time)}{' '}
                        </span>
                      )}
                      {subject.questions.length} 題
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Bank
