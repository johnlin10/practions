import { useEffect, useState } from 'react'
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

function Bank() {
  const { subjectId } = useParams()
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    setCurrentTime(new Date())

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

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
              {Object.values(subjects).map((subject) => {
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
                          {lockStatus.text} {formatLockTime(lockStatus.time)}{' '}
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
