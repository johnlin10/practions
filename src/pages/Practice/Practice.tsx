import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Practice.scss'

// components
import Stepper from '@/components/Stepper/Stepper'
import SubjectPicker from '@/components/SubjectPicker/SubjectPicker'
import MasteryBar, { MasteryPercent } from '@/components/MasteryBar/MasteryBar'
import Modal from '@/components/Modal/Modal'

// data
import {
  buildReviewFlow,
  countByKind,
  dueToday,
  useWrongQuestions,
} from '@/data/wrongQuestions'
import { masteryPercent, useMastery } from '@/data/mastery'
import { useHistoryReady, useHistoryStore } from '@/data/historyStore'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import {
  buildPracticeFlow,
  defaultPracticeSubject,
  practiceSubjects,
} from '@/data/practice'
import { PRACTICE_LIMITS, REVIEW_LIMITS } from '@/types/settings'
import SlideLink from '@/components/SlideLink/SlideLink'

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
  // 登入中的雲端紀錄尚未到達時不閃出「目前沒有錯題」
  const ready = useHistoryReady()
  const {
    reviewLimit,
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

  const isVocabulary = subject?.baseQuestionType === 'vocabulary'

  // 切換題庫的清單；還沒選題庫時按「開始練習」也會打開
  const [pickerOpen, setPickerOpen] = useState(false)
  // 「調整」彈窗：隨手練或錯題複習的設定
  const [settingsOpen, setSettingsOpen] = useState<
    'practice' | 'review' | null
  >(null)
  const closeSettings = (): void => setSettingsOpen(null)

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
          <SlideLink to="/practice/history" className="no-style">
            <p>紀錄</p>
            <span className="material-symbols-rounded">chevron_right</span>
          </SlideLink>
        </h1>

        {/* 隨手練：題庫（含掌握度）、設定摘要、開始；設定收在「調整」彈窗 */}
        <section className="practice-section">
          <p className="practice-section-title">
            <span className="practice-icon material-symbols-rounded fill">
              exercise
            </span>
            隨手練
          </p>
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
          >
            {subjectMastery && (
              <span className="subject-mastery">
                <span>掌握度</span>
                <MasteryBar percent={masteryPercent(subjectMastery)} />
                <strong>
                  <MasteryPercent percent={masteryPercent(subjectMastery)} />
                </strong>
              </span>
            )}
          </SubjectPicker>
          <div className="practice-summary">
            <p>
              {practiceLimit} 題
              {isVocabulary &&
                (practiceSpelling ? '・含 Spelling' : '・不含 Spelling')}
            </p>
            <button
              className="practice-adjust-btn"
              onClick={() => setSettingsOpen('practice')}
            >
              <span className="material-symbols-rounded">tune</span>
              調整
            </button>
          </div>
          <button className="practice-start-btn" onClick={start}>
            開始練習
          </button>
          <Modal
            open={settingsOpen === 'practice'}
            onClose={closeSettings}
            title="隨手練設定"
            actions={<button onClick={closeSettings}>完成</button>}
          >
            <div className="practice-settings">
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
              {isVocabulary && (
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
          </Modal>
        </section>

        {/* 錯題複習：依科目列出待複習的錯題，一次複習一個科目；每次題數收在「調整」彈窗 */}
        <section className="practice-section review">
          <p className="practice-section-title">
            <span className="practice-icon material-symbols-rounded fill">
              replay
            </span>
            錯題複習
            {dueGroups.length > 0 && (
              <span className="practice-section-count">
                <strong>
                  {dueGroups.reduce((sum, g) => sum + g.items.length, 0)}
                </strong>{' '}
                題待複習
              </span>
            )}
          </p>
          {!ready ? null : dueGroups.length > 0 ? (
            <>
              <ul className="review-list">
                {dueGroups.map((group) => (
                  <li key={group.subject.id}>
                    <p>
                      <strong>{group.subject.name}</strong>
                      <small>
                        {[
                          `${group.items.length} 題`,
                          ...countByKind(group.items).map(
                            ([label, n]) => `${label} ${n}`,
                          ),
                        ].join('・')}
                      </small>
                    </p>
                    <button
                      className="review-start-btn"
                      onClick={() =>
                        navigate(`/quiz/${group.subject.id}`, {
                          state: {
                            customFlowConfig: buildReviewFlow(
                              group,
                              reviewLimit,
                            ),
                          },
                        })
                      }
                    >
                      開始
                      <span className="material-symbols-rounded">
                        chevron_right
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="practice-summary">
                <p>每次最多 {reviewLimit} 題</p>
                <button
                  className="practice-adjust-btn"
                  onClick={() => setSettingsOpen('review')}
                >
                  <span className="material-symbols-rounded">tune</span>
                  調整
                </button>
              </div>
            </>
          ) : (
            <p className="review-empty">
              <span className="material-symbols-rounded fill">
                check_circle
              </span>
              {wrongGroups.length > 0 ? '今天的複習完成了' : '目前沒有錯題'}
            </p>
          )}
          <Modal
            open={settingsOpen === 'review'}
            onClose={closeSettings}
            title="錯題複習設定"
            actions={<button onClick={closeSettings}>完成</button>}
          >
            <div className="practice-settings">
              <div className="practice-option">
                <p>每次題數</p>
                <Stepper
                  label="每次複習題數"
                  value={reviewLimit}
                  onChange={(v) => updateSettings({ reviewLimit: v })}
                  {...REVIEW_LIMITS}
                  unit="題"
                />
              </div>
            </div>
          </Modal>
        </section>
      </div>
    </div>
  )
}

export default Practice
