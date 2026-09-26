import React, { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import './Bank.scss'

// data
import { subjects } from '../../data/subjects'
import {
  subjectGroups,
  SubjectGroup,
  groupSubjects,
} from '../../data/subject-groups'

// utils
import {
  isSubjectLocked,
  getLockStatus,
  formatLockTime,
} from './utils/bankHelpers'

// 標上 [NEW] 標籤的題庫 id
const NEW_SUBJECT_IDS = ['erp_distribution', 'pvqc_healthcare']

const subjectSections = groupSubjects(Object.values(subjects))

/**
 * [page] Bank page
 * 題庫頁面，顯示所有可用的科目
 */
function Bank(): React.ReactElement {
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

  return (
    <>
      <Outlet />
      <div className="page">
        <div className="page-container">
          <h1>題庫</h1>
          <div className="subjects-section">
            <div className="subjects-grid">
              {subjectSections.map(({ group, subjects: members }) => {
                const cards = members.map((subject) => {
                  const locked = isSubjectLocked(subject)
                  const lockStatus = getLockStatus(subject, currentTime)
                  const cardClassName = `subject-card no-style${
                    locked ? ' locked' : ''
                  }`
                  const cardContent = (
                    <>
                      {NEW_SUBJECT_IDS.includes(subject.id) && (
                        <span className="new-badge">NEW</span>
                      )}
                      <p className="subject-name">
                        {locked && (
                          <span className="material-symbols-rounded">lock</span>
                        )}
                        {subject.name}
                      </p>

                      <p>
                        {subject.lockTime && lockStatus.status !== 'none' && (
                          <span
                            className={`lock-time ${locked ? 'locked' : ''}`}
                          >
                            {lockStatus.text}{' '}
                            {lockStatus.time &&
                              formatLockTime(lockStatus.time)}{' '}
                          </span>
                        )}
                        {subject.questions.length} 題
                      </p>
                    </>
                  )

                  // 鎖定的科目渲染為不可點的 div，取代原本 to="" 的無效導航 hack
                  return locked ? (
                    <div
                      key={subject.id}
                      className={cardClassName}
                      aria-disabled="true"
                    >
                      {cardContent}
                    </div>
                  ) : (
                    <Link
                      key={subject.id}
                      className={cardClassName}
                      to={`/bank/${subject.id}`}
                    >
                      {cardContent}
                    </Link>
                  )
                })

                if (!group) return cards
                const { title, showTitle = true }: SubjectGroup =
                  subjectGroups[group]
                return (
                  <div
                    key={group}
                    className={`subject-group${showTitle ? ' has-title' : ''}`}
                  >
                    {showTitle && <h5>{title}</h5>}
                    {cards}
                  </div>
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
