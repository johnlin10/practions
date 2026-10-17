import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Practice.scss'

// components
import Stepper from '@/components/Stepper/Stepper'
import SubjectPicker from '@/components/SubjectPicker/SubjectPicker'
import MasteryBar, { MasteryPercent } from '@/components/MasteryBar/MasteryBar'

// data
import { dueToday, useWrongQuestions } from '@/data/wrongQuestions'
import { masteryPercent, useMastery } from '@/data/mastery'
import { useHistoryStore } from '@/data/historyStore'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import {
  buildPracticeFlow,
  defaultPracticeSubject,
  practiceSubjects,
} from '@/data/practice'
import { PRACTICE_LIMITS } from '@/types/settings'

/**
 * [page] Practice page
 * 練習：答一題就看到對錯的輕鬆練習，包含錯題複習與隨手練
 */
function Practice(): React.ReactElement {
  const navigate = useNavigate()
  // 錯題
  const wrongGroups = useWrongQuestions()
  // 今天可以複習的錯題（今天已經答對過的隔天再確認，含到期的回顧題）
  const dueGroups = dueToday(wrongGroups)
  const mastery = useMastery()
  const history = useHistoryStore()
  const {
    practiceLimit,
    practiceSpelling,
    practiceSubject,
    practiceSubjectAt,
  } = useSettingsStore()
  // 隨手練的題庫：最後一次作答或手動選擇的
  const subject = defaultPracticeSubject(
    practiceSubject,
    practiceSubjectAt,
    history,
  )
  const subjectMastery = subject && mastery.get(subject.id)

  // 切換題庫的清單；還沒選題庫時按「開始練習」也會打開
  const [pickerOpen, setPickerOpen] = useState(false)

  const start = (): void => {
    if (!subject) return setPickerOpen(true)
    navigate(`/quiz/${subject.id}`, {
      state: {
        customFlowConfig: buildPracticeFlow(
          subject,
          practiceLimit,
          practiceSpelling,
        ),
      },
    })
  }

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

        {/* 隨手練：一張卡片，記住上次的題庫，點題庫名稱切換 */}
        <section className="practice-card">
          <p className="practice-card-title">
            <span className="practice-icon material-symbols-rounded fill">
              exercise
            </span>
            隨手練
          </p>
          {/* 題庫：選擇器，下方是這個題庫的掌握度 */}
          <div className="practice-subject">
            <SubjectPicker
              subjects={practiceSubjects()}
              value={subject}
              onChange={(option) =>
                updateSettings({
                  practiceSubject: option.id,
                  practiceSubjectAt: Date.now(),
                })
              }
              open={pickerOpen}
              onOpenChange={setPickerOpen}
            />
            {subjectMastery && (
              <div className="subject-mastery">
                <p>掌握度</p>
                <MasteryBar percent={masteryPercent(subjectMastery)} />
                <strong>
                  <MasteryPercent percent={masteryPercent(subjectMastery)} />
                </strong>
              </div>
            )}
          </div>
          {/* 設定：同 PVQC 自訂測驗的列表，左邊名稱、右邊調整 */}
          <div className="practice-options">
            <div className="practice-option">
              <p>題數</p>
              <Stepper
                label="隨手練題數"
                value={practiceLimit}
                onChange={(v) => updateSettings({ practiceLimit: v })}
                {...PRACTICE_LIMITS}
                unit="題"
              />
            </div>
            {subject?.baseQuestionType === 'vocabulary' && (
              <label className="practice-option">
                <p>
                  包含 Spelling
                  <small>看中拼英</small>
                </p>
                <input
                  type="checkbox"
                  role="switch"
                  className="switch"
                  checked={practiceSpelling}
                  onChange={(e) =>
                    updateSettings({ practiceSpelling: e.target.checked })
                  }
                />
              </label>
            )}
          </div>
          <button className="practice-start-btn" onClick={start}>
            開始練習
          </button>
        </section>

        {/* 錯題複習入口（樣式同測驗頁的 PVQC 入口，見 Quiz.scss） */}
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
