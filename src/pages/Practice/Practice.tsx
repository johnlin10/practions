import React, { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Practice.scss'

// components
import Stepper from '@/components/Stepper/Stepper'
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
  const { practiceLimit, practiceSubject, practiceSubjectAt } =
    useSettingsStore()
  // 隨手練的題庫：最後一次作答或手動選擇的
  const subject = defaultPracticeSubject(
    practiceSubject,
    practiceSubjectAt,
    history,
  )
  const subjectMastery = subject && mastery.get(subject.id)

  // 切換題庫的清單（原生 <dialog>：焦點、Esc、背景無法操作由瀏覽器處理）
  const pickerRef = useRef<HTMLDialogElement>(null)
  const [closing, setClosing] = useState(false)
  const openPicker = (): void => pickerRef.current?.showModal()
  const closePicker = (): void => setClosing(true)
  const handlePickerAnimationEnd = (e: React.AnimationEvent): void => {
    // 背景（::backdrop）的動畫也會在 <dialog> 上觸發，只看清單本體的
    if (e.target !== e.currentTarget || e.nativeEvent.pseudoElement) return
    if (!closing) return
    pickerRef.current?.close()
    setClosing(false)
  }

  const start = (): void => {
    if (!subject) return openPicker()
    navigate(`/quiz/${subject.id}`, {
      state: { customFlowConfig: buildPracticeFlow(subject, practiceLimit) },
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
          <button className="practice-subject" onClick={openPicker}>
            <span className="practice-subject-name">
              {subject ? subject.name : '選擇題庫'}
            </span>
            <span className="practice-subject-switch">
              {subject && '切換'}
              <span className="material-symbols-rounded">expand_more</span>
            </span>
          </button>
          {subjectMastery && (
            <div className="subject-mastery">
              <MasteryBar percent={masteryPercent(subjectMastery)} />
              <p>
                掌握度{' '}
                <MasteryPercent percent={masteryPercent(subjectMastery)} />
              </p>
            </div>
          )}
          <div className="practice-limit">
            <p>題數</p>
            <Stepper
              label="隨手練題數"
              value={practiceLimit}
              onChange={(v) => updateSettings({ practiceLimit: v })}
              {...PRACTICE_LIMITS}
              unit="題"
            />
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

        <dialog
          ref={pickerRef}
          className={`practice-picker${closing ? ' closing' : ''}`}
          aria-labelledby="practice-picker-title"
          onCancel={(e) => {
            e.preventDefault()
            closePicker()
          }}
          // 點背景（清單本體之外）關閉
          onClick={(e) => {
            if (e.target === e.currentTarget) closePicker()
          }}
          onAnimationEnd={handlePickerAnimationEnd}
        >
          <h3 id="practice-picker-title">選擇題庫</h3>
          <div className="practice-picker-list">
            {practiceSubjects().map((option) => {
              const optionMastery = mastery.get(option.id)
              const selected = option.id === subject?.id
              return (
                <button
                  key={option.id}
                  className={selected ? 'selected' : undefined}
                  aria-pressed={selected}
                  onClick={() => {
                    updateSettings({
                      practiceSubject: option.id,
                      practiceSubjectAt: Date.now(),
                    })
                    closePicker()
                  }}
                >
                  <span className="practice-picker-name">{option.name}</span>
                  {optionMastery && (
                    <span className="practice-picker-mastery">
                      掌握度{' '}
                      <MasteryPercent percent={masteryPercent(optionMastery)} />
                    </span>
                  )}
                  {selected && (
                    <span className="material-symbols-rounded">check</span>
                  )}
                </button>
              )
            })}
          </div>
        </dialog>
      </div>
    </div>
  )
}

export default Practice
