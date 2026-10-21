import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../Bank.scss'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import Modal from '@/components/Modal/Modal'
import MasteryBar, {
  MasteryModes,
  MasteryPercent,
  MasteryRing,
} from '@/components/MasteryBar/MasteryBar'

// utils
import {
  isSubjectLocked,
  getLockStatus,
  getSearchPlaceholder,
  formatLockTime,
  sortWords,
  groupWords,
  MASK_OPTIONS,
  SORT_OPTIONS,
  GROUP_OPTIONS,
} from '../utils/bankHelpers'
import { shuffle } from '@/utils/pick-questions'

// types
import {
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  VocabularyQuestion,
  QuestionTypeId,
  QUESTION_TYPE_LABELS,
} from '../../../types/questions'
import { SubjectConfig } from '../../../types/quiz-flows'

// data
import { subjects } from '../../../data/subjects'
import { masteryPercent, useMastery } from '@/data/mastery'
import { updateSettings, useSettingsStore } from '@/data/settingsStore'
import {
  OptionImage,
  QuestionImages,
} from '@/components/QuestionImage/QuestionImage'
import { speakEnglish } from '../../../utils/tts'

// interfaces
interface SingleBankParams extends Record<string, string | undefined> {
  subjectId?: string
}

// 遮住的字點一下後顯示多久
const REVEAL_MS = 2000

const vocabularyOf = (subjectId?: string): VocabularyQuestion[] =>
  (subjects[subjectId ?? '']?.questions ?? []).filter(
    (q): q is VocabularyQuestion => q.type === 'vocabulary',
  )

/**
 * [page] SingleBank page
 * 單一科目的題庫詳細頁面，顯示該科目的所有題目
 */
const SingleBank: React.FC = () => {
  // 取得科目 ID
  const { subjectId } = useParams<SingleBankParams>()
  // 導航
  const navigate = useNavigate()
  // 這個題庫的掌握度（沒做過的題庫沒有），點左上角的按鈕彈出
  const mastery = useMastery().get(subjectId ?? '')
  const [masteryOpen, setMasteryOpen] = useState(false)
  // 搜尋關鍵字
  const [searchTerm, setSearchTerm] = useState<string>('')
  // 題型篩選（混合題型的題庫才有，null 為全部）
  const [typeFilter, setTypeFilter] = useState<QuestionTypeId | null>(null)
  // 是否鎖定
  const [isLocked, setIsLocked] = useState<boolean>(false)
  // 當前時間
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  // 單字題庫的檢視方式（遮住、排序、分組），記在設定裡
  const { bankMask, bankSort, bankGroup } = useSettingsStore()
  const [viewOpen, setViewOpen] = useState(false)
  // 隨機排序的順序：打開題庫時洗一次，再選一次「隨機」會重洗
  const [shuffledWords, setShuffledWords] = useState(() =>
    shuffle(vocabularyOf(subjectId)),
  )
  // 遮住時點一下暫時顯示的單字，REVEAL_MS 後恢復模糊
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set())
  const revealTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  // 正在念的單字，發音圖示顯示為藍色，念完恢復
  const [playingId, setPlayingId] = useState<string | null>(null)
  const playToken = useRef(0)

  useEffect(() => {
    const timers = revealTimers.current
    return () => timers.forEach(clearTimeout)
  }, [])

  // 更新當前時間
  useEffect(() => {
    setCurrentTime(new Date())

    const intervalId = setInterval(() => {
      setCurrentTime(new Date())
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  /**
   * [function] renderQuestionContent
   * 渲染題目內容
   * @param {Question} question - 題目
   * @returns {React.ReactNode} - 渲染題目內容
   */
  const renderQuestionContent = (question: Question): React.ReactNode => {
    // 如果科目 ID 不存在，則返回 null
    if (!subjectId) return null

    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目不存在，則返回 null
    if (!subject) return null

    // 根據不同題型渲染不同格式
    switch (question.type) {
      case 'single_choice':
        return renderSingleChoice(question as SingleChoiceQuestion)
      case 'multiple_choice':
        return renderMultipleChoice(question as MultipleChoiceQuestion)
      case 'true_false':
        return renderTrueFalse(question as TrueFalseQuestion)
      case 'vocabulary':
        return renderVocabulary(question as VocabularyQuestion)
      default:
        return null
    }
  }

  /**
   * [function] renderSingleChoice
   * 渲染單選題
   * @param {SingleChoiceQuestion} question - 單選題
   * @returns {React.ReactNode} - 渲染單選題
   */
  const renderSingleChoice = (
    question: SingleChoiceQuestion,
  ): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header">
          <span className="question-number">#{question.id}</span>
          <p className="question-text">{question.question}</p>
        </div>
        <QuestionImages images={question.images} />
        <div className="options">
          {question.options.map((option, idx) => (
            <div
              key={idx}
              className={`option ${
                idx === question.correctIndex ? 'correct-answer' : ''
              }`}
            >
              {String.fromCharCode(65 + idx)}.{' '}
              <OptionImage name={question.optionImages?.[idx]} />
              {option}
            </div>
          ))}
        </div>
        <div className="answer-info">
          <span className="answer-label">正確答案：</span>
          <span className="answer">
            {String.fromCharCode(65 + question.correctIndex)}
          </span>
        </div>
      </div>
    )
  }

  /**
   * [function] renderMultipleChoice
   * 渲染多選題
   * @param {MultipleChoiceQuestion} question - 多選題
   * @returns {React.ReactNode} - 渲染多選題
   */
  const renderMultipleChoice = (
    question: MultipleChoiceQuestion,
  ): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header">
          <span className="question-number">#{question.id}</span>
          <p className="question-text">{question.question}</p>
        </div>
        <QuestionImages images={question.images} />
        <div className="options">
          {question.options.map((option, idx) => (
            <div
              key={idx}
              className={`option ${
                question.correctIndexes.includes(idx) ? 'correct-answer' : ''
              }`}
            >
              {String.fromCharCode(65 + idx)}.{' '}
              <OptionImage name={question.optionImages?.[idx]} />
              {option}
            </div>
          ))}
        </div>
        <div className="answer-info">
          <span className="answer-label">正確答案：</span>
          <span className="answer">
            {question.correctIndexes
              .map((idx) => String.fromCharCode(65 + idx))
              .join(', ')}
          </span>
        </div>
      </div>
    )
  }

  /**
   * [function] renderTrueFalse
   * 渲染是非題
   * @param {TrueFalseQuestion} question - 是非題
   * @returns {React.ReactNode} - 渲染是非題
   */
  const renderTrueFalse = (question: TrueFalseQuestion): React.ReactNode => {
    return (
      <div key={question.id} className="question-item">
        <div className="question-header true-false">
          <span className="question-number">#{question.id}</span>
          {question.correctAnswer ? (
            <span className="true-answer">O</span>
          ) : (
            <span className="false-answer">X</span>
          )}
          <p className="question-text">{question.question}</p>
        </div>
      </div>
    )
  }

  /**
   * [function] renderVocabulary
   * 渲染單字題：緊湊列表的一列，發音圖示在最前面；英文沒被遮住時，點圖示到單字都會念
   * @param {VocabularyQuestion} question - 單字題
   * @returns {React.ReactNode} - 渲染單字題
   */
  const renderVocabulary = (question: VocabularyQuestion): React.ReactNode => {
    const withWord = bankMask !== 'english'
    return (
      <div key={question.id} className="vocabulary-row">
        <button
          className={`vocabulary-play${withWord ? ' with-word' : ''}${
            playingId === question.id ? ' playing' : ''
          }`}
          aria-label={withWord ? undefined : `念出 ${question.english}`}
          onClick={() => playWord(question)}
        >
          <span className="material-symbols-rounded" aria-hidden="true">
            volume_up
          </span>
          {withWord && <span className="english">{question.english}</span>}
        </button>
        {!withWord && renderWordText(question, 'english')}
        {renderWordText(question, 'chinese')}
      </div>
    )
  }

  /**
   * [function] renderWordText
   * 單字的英文或中文；被遮住時是模糊的按鈕，點了暫時顯示
   * @param {VocabularyQuestion} question - 單字題
   * @param {'english' | 'chinese'} side - 英文或中文
   * @returns {React.ReactNode} - 文字
   */
  const renderWordText = (
    question: VocabularyQuestion,
    side: 'english' | 'chinese',
  ): React.ReactNode => {
    if (bankMask !== side) {
      return <span className={side}>{question[side]}</span>
    }
    return (
      <button
        className={`${side} masked${revealed.has(question.id) ? ' revealed' : ''}`}
        aria-label={side === 'english' ? '顯示英文' : '顯示中文'}
        onClick={() => revealWord(question.id)}
      >
        {question[side]}
      </button>
    )
  }

  /**
   * [function] revealWord
   * 暫時顯示遮住的字，REVEAL_MS 後恢復；顯示中再點一次會重新計時
   * @param {string} id - 題目 ID
   * @returns {void}
   */
  const revealWord = (id: string): void => {
    clearTimeout(revealTimers.current.get(id))
    setRevealed((prev) => new Set(prev).add(id))
    revealTimers.current.set(
      id,
      setTimeout(() => {
        revealTimers.current.delete(id)
        setRevealed((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, REVEAL_MS),
    )
  }

  /**
   * [function] playWord
   * 使用 Web Speech API 播放單字
   * @param {VocabularyQuestion} question - 單字題
   * @returns {void}
   */
  const playWord = (question: VocabularyQuestion): void => {
    if (question.english) {
      // 換念另一個字時，前一個字結束的通知不能把新的藍色圖示收掉
      const token = ++playToken.current
      const done = (): void => {
        if (playToken.current === token) setPlayingId(null)
      }
      setPlayingId(question.id)
      speakEnglish(question.english, {
        rate: 0.85,
        onEnd: done,
        onError: done,
      })
    }
  }

  /**
   * [function] getFilteredQuestions
   * 過濾題目
   * @returns {Question[]} - 過濾後的題目
   */
  const getFilteredQuestions = (): Question[] => {
    // 如果科目 ID 不存在或被鎖定，則返回空陣列
    if (!subjectId || isLocked) return []

    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目不存在，則返回空陣列
    if (!subject) return []

    // 取得科目題目（依題型篩選）
    const currentQuestions = typeFilter
      ? subject.questions.filter((q) => q.type === typeFilter)
      : subject.questions
    return currentQuestions.filter(matchesSearch)
  }

  /**
   * [function] matchesSearch
   * 題目是否符合搜尋關鍵字（沒有關鍵字時都符合）
   * @param {Question} question - 題目
   * @returns {boolean} - 是否符合
   */
  const matchesSearch = (question: Question): boolean => {
    // 如果沒有搜尋關鍵字，則都符合
    if (!searchTerm) return true

    // 通用的 ID 搜尋邏輯
    if (searchTerm.startsWith('#')) {
      return question.id?.toString() === searchTerm.slice(1)
    }

    // 根據不同題型進行搜尋
    // 如果搜尋關鍵字包含題目或選項，則符合
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
        return (
          question.question
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          question.options?.some((option) =>
            option.toLowerCase().includes(searchTerm.toLowerCase()),
          )
        )

      case 'true_false':
        return question.question
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())

      case 'vocabulary':
        return (
          question.english
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          question.chinese?.includes(searchTerm)
        )

      default:
        return false
    }
  }

  //* 檢查鎖定狀態
  useEffect(() => {
    // 如果科目 ID 不存在，則設定為未鎖定
    if (!subjectId) {
      setIsLocked(false)
      return
    }
    // 取得科目
    const subject = subjects[subjectId]
    // 如果科目存在，則檢查鎖定狀態
    if (subject) {
      setIsLocked(isSubjectLocked(subject))
    }
  }, [subjectId])

  /**
   * [function] checkLockStatus
   * 檢查鎖定狀態
   * @returns {void}
   */
  const checkLockStatus = useCallback(() => {
    if (!subjectId) {
      setIsLocked(false)
      return
    }

    const subject = subjects[subjectId]
    if (subject) {
      setIsLocked(isSubjectLocked(subject))
    }
  }, [subjectId])

  // 每 10 秒檢查一次鎖定狀態
  useEffect(() => {
    // 檢查鎖定狀態
    checkLockStatus()

    // 每 10 秒檢查一次鎖定狀態
    const intervalId = setInterval(() => {
      checkLockStatus()
    }, 10000)

    return () => clearInterval(intervalId)
  }, [subjectId, checkLockStatus])

  /**
   * [function] handleClose
   * 處理關閉單一題庫頁面
   * @returns {void}
   */
  const handleClose = (): void => {
    // 滑出動畫由頁面轉場負責（App.scss）
    navigate('/bank', { viewTransition: true })
  }

  // 如果科目 ID 不存在，則顯示錯誤訊息
  if (!subjectId) {
    return (
      <div className="single-bank">
        <div className="single-bank-container">
          <div className="error-message">
            <h2>找不到指定的題庫</h2>
            <button onClick={() => navigate('/bank')}>返回題庫列表</button>
          </div>
        </div>
      </div>
    )
  }

  // 取得科目
  const subject: SubjectConfig = subjects[subjectId]
  // 如果科目不存在，則顯示錯誤訊息
  if (!subject) {
    return (
      <div className="single-bank">
        <div className="single-bank-container">
          <div className="error-message">
            <h2>找不到指定的題庫</h2>
            <button onClick={() => navigate('/bank')}>返回題庫列表</button>
          </div>
        </div>
      </div>
    )
  }

  // 題庫內的題型（超過一種才顯示篩選）
  const questionTypes = [...new Set(subject.questions.map((q) => q.type))]
  // 單字題庫：緊湊列表，可以遮住、排序、分組
  const isVocabulary = subject.baseQuestionType === 'vocabulary'
  const vocabulary = vocabularyOf(subjectId)
  const viewChanged =
    bankMask !== 'none' || bankSort !== 'none' || bankGroup !== 'none'

  // 渲染單一題庫頁面
  return (
    <div className="single-bank">
      <button className="close-btn" onClick={handleClose}>
        <span className="material-symbols-rounded">close</span>
      </button>
      {/* 掌握度：題庫列表已經看得到，這裡做成左上角的按鈕，不跟題目混在一起 */}
      {mastery && !isLocked && (
        <>
          <button
            className="mastery-btn"
            onClick={() => setMasteryOpen(true)}
            aria-label="查看掌握度"
          >
            <MasteryRing percent={masteryPercent(mastery)} />
            <MasteryPercent percent={masteryPercent(mastery)} />
          </button>
          <Modal
            open={masteryOpen}
            onClose={() => setMasteryOpen(false)}
            title="掌握度"
            actions={
              <button onClick={() => setMasteryOpen(false)}>關閉</button>
            }
          >
            <div className="bank-mastery">
              <p className="bank-mastery-total">
                <strong>
                  <MasteryPercent percent={masteryPercent(mastery)} />
                </strong>
                {/* 單字題庫一個字有六種作答方式，總數不好理解，改看下方各作答方式 */}
                {mastery.modes.length === 1 &&
                  `已掌握 ${mastery.mastered} / ${mastery.total} 題`}
              </p>
              <MasteryBar percent={masteryPercent(mastery)} />
              {mastery.modes.length > 1 && (
                <MasteryModes modes={mastery.modes} />
              )}
            </div>
          </Modal>
        </>
      )}
      <div className="single-bank-container">
        <h2>
          {subject.name}
          {subject.lockTime && (
            <>
              {(() => {
                const status = getLockStatus(subject, currentTime)
                const locked = isSubjectLocked(subject)
                if (status.status !== 'none' && status.time) {
                  return (
                    <span className={`lock-time ${locked ? 'locked' : ''}`}>
                      {status.text} {formatLockTime(status.time)}{' '}
                    </span>
                  )
                }
                return null
              })()}
            </>
          )}
        </h2>

        {/* 如果被鎖定，顯示鎖定訊息 */}
        {isLocked ? (
          <div className="locked-message">
            <h2>此題庫目前不開放查看</h2>
            <p>為維護考試公平性，考試期間題庫暫時關閉</p>
          </div>
        ) : (
          <>
            {/* 搜尋區域 */}
            <div
              className={`search-section${questionTypes.length > 1 ? ' has-filter' : ''}`}
            >
              <div className="search-box">
                <input
                  id="bank-search"
                  name="search"
                  type="text"
                  aria-label="搜尋題目"
                  placeholder={getSearchPlaceholder(subject.baseQuestionType)}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                {isVocabulary && (
                  <button
                    className={`view-btn${viewChanged ? ' changed' : ''}`}
                    aria-label="檢視方式"
                    onClick={() => setViewOpen(true)}
                  >
                    <span className="material-symbols-rounded" aria-hidden="true">
                      tune
                    </span>
                  </button>
                )}
              </div>
              {/* 題型篩選（混合題型的題庫才有），跟著搜尋框固定在頂部 */}
              {questionTypes.length > 1 && (
                <SegmentedControl
                  className="type-filter"
                  label="依題型篩選"
                  value={typeFilter ?? 'all'}
                  onChange={(value) =>
                    setTypeFilter(value === 'all' ? null : value)
                  }
                  options={[
                    { value: 'all', label: '全部' },
                    ...questionTypes.map((type) => ({
                      value: type,
                      label: QUESTION_TYPE_LABELS[type].replace('題', ''),
                    })),
                  ]}
                />
              )}
            </div>

            {/* 題目列表 */}
            <div className="questions-list">
              {/* 來源署名：放在列表裡，跟著題目捲動 */}
              {subject.source && (
                <p className="bank-source">{subject.source}</p>
              )}
              {isVocabulary
                ? groupWords(
                    sortWords(vocabulary, bankSort, shuffledWords),
                    bankGroup,
                  ).map(({ title, words }) => {
                    // 搜尋時只留下有符合單字的組，組名不變
                    const shown = words.filter(matchesSearch)
                    if (!shown.length) return null
                    return (
                      <div
                        key={title}
                        className={`vocabulary-list${title ? ' has-title' : ''}`}
                      >
                        {title && <h5>{title}</h5>}
                        {shown.map(renderVocabulary)}
                      </div>
                    )
                  })
                : getFilteredQuestions().map((question) =>
                    renderQuestionContent(question),
                  )}
            </div>

            {/* 單字題庫的檢視方式：點了立刻生效，背後的列表跟著變 */}
            {isVocabulary && (
              <Modal
                open={viewOpen}
                onClose={() => setViewOpen(false)}
                title="檢視方式"
                actions={
                  <button onClick={() => setViewOpen(false)}>完成</button>
                }
              >
                <div className="bank-view">
                  <div>
                    <h5>遮住</h5>
                    <SegmentedControl
                      size="lg"
                      label="遮住"
                      value={bankMask}
                      onChange={(value) => updateSettings({ bankMask: value })}
                      options={MASK_OPTIONS}
                    />
                  </div>
                  <div>
                    <h5>排序</h5>
                    <SegmentedControl
                      size="lg"
                      label="排序"
                      value={bankSort}
                      onChange={(value) => {
                        if (value === 'random') {
                          setShuffledWords(shuffle(vocabulary))
                        }
                        updateSettings({ bankSort: value })
                      }}
                      options={SORT_OPTIONS}
                    />
                  </div>
                  <div>
                    <h5>分組</h5>
                    <SegmentedControl
                      size="lg"
                      label="分組"
                      value={bankGroup}
                      onChange={(value) => updateSettings({ bankGroup: value })}
                      options={GROUP_OPTIONS}
                    />
                  </div>
                </div>
              </Modal>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SingleBank
