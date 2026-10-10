import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'
import './Quiz.scss'

// components
import Timer from '../../components/Timer/Timer'
import PVQCWriteQuestion from './components/PVQCWriteQuestion'
import PVQCReadQuestion from './components/PVQCReadQuestion'
import PVQCListenQuestion from './components/PVQCListenQuestion'
import PVQCPronunciationQuestion from './components/PVQCPronunciationQuestion'
import PVQCReadListenQuestion from './components/PVQCReadListenQuestion'
import StandardQuestion from './components/StandardQuestion'

// context
import { useQuiz } from '../../context/QuizContext'

// utils
import { isSubjectLocked } from '../Bank/utils/bankHelpers'
import {
  generatePVQCOptions,
  generatePVQCPronunciationOptions,
} from '../../utils/pvqc-helpers'

// types
import { QuizFlowConfig } from '../../types/quiz-flows'
import {
  QUESTION_TYPE_LABELS,
  Question,
  VocabularyQuestion,
} from '../../types/questions'

// data
import { subjects } from '../../data/subjects'
import { useWrongQuestions } from '../../data/wrongQuestions'
import {
  subjectGroups,
  SubjectGroup,
  groupSubjects,
} from '../../data/subject-groups'

// utils
import {
  answerKey,
  baseStageId,
  isRetryStage,
  retryStageId,
} from '../../utils/answer-key'
import { showAlert } from '../../utils/dialog'
import {
  randomPrepareFrames,
  randomPrepareMs,
} from '../../utils/prepare-progress'

// interfaces
// 預覽所有題目的彈窗元件 Props 介面
interface PreviewAllQuestionsProps {
  close: () => void
  pvqcOptionsCache: Record<string, string[]>
}

/** 即時回饋答錯時列出的正確答案：選項字母與內容（多選依序列出），是非題為 O／X 圖示。 */
function CorrectAnswers({ question }: { question: Question }) {
  const options = (indexes: number[], texts: string[]) =>
    [...indexes]
      .sort((a, b) => a - b)
      .map((index) => (
        <li key={index}>
          <span className="option-letter">
            {String.fromCharCode(65 + index)}
          </span>
          {texts[index]}
        </li>
      ))

  switch (question.type) {
    case 'single_choice':
      return <ul>{options([question.correctIndex], question.options)}</ul>
    case 'multiple_choice':
      return <ul>{options(question.correctIndexes, question.options)}</ul>
    case 'true_false':
      return (
        <ul>
          <li>
            <span className="material-symbols-outlined">
              {question.correctAnswer ? 'circle' : 'close'}
            </span>
          </li>
        </ul>
      )
    default:
      return null
  }
}

// 科目列表：只列出開放測驗的題庫，並依題組分組
const quizSections = groupSubjects(
  Object.values(subjects).filter((subject) => subject.quizOpen),
)

/**
 * [page] Quiz page
 * 測驗頁面，支援科目選擇、PVQC 測驗和標準測驗，並提供預覽所有題目的功能
 */
function Quiz(): React.ReactElement {
  // 取得科目 ID
  const { subjectId } = useParams<{ subjectId: string }>()
  // 導航函數
  const navigate = useNavigate()
  // 取得當前路徑
  const location = useLocation()
  // 取得科目資訊
  const subject = subjectId ? subjects[subjectId] || null : null
  // 預覽所有題目的狀態
  const [previewAllQuestions, setPreviewAllQuestions] = useState<boolean>(false)
  // 錯題（測驗列表的錯題複習卡片）
  const wrongGroups = useWrongQuestions()
  // 是否顯示「正在準備」畫面
  const [preparing, setPreparing] = useState<boolean>(true)
  // 這次準備畫面停留的時間（每次隨機）
  const [prepareMs, setPrepareMs] = useState<number>(randomPrepareMs)
  // 準備畫面的進度條
  const prepareBarRef = useRef<HTMLDivElement>(null)
  // 已經按過「繼續」的再練一次階段（之前先顯示過渡畫面）
  const [retryIntroDone, setRetryIntroDone] = useState<string | null>(null)

  // 取得測驗上下文
  const {
    startQuiz,
    quizState,
    submitAnswer,
    finishQuiz,
    finishStage,
    handlePrev,
    handleNext,
    hasNextStage,
    checkAnswer,
    continueFeedback,
  } = useQuiz()

  // 自訂流程配置（從 PVQCSetup、錯題複習傳來），沒有就用科目預設
  const customFlowConfig = (location.state as any)?.customFlowConfig as
    | QuizFlowConfig
    | undefined
  const flowConfig = customFlowConfig ?? subject?.flowConfig

  // 當科目 ID 或路徑狀態改變時，先顯示「正在準備」，結束後才出題並開始計時
  useEffect(() => {
    if (!subject) return

    const ms = randomPrepareMs()
    setPrepareMs(ms)
    setPreparing(true)
    setRetryIntroDone(null)
    const timeout = setTimeout(() => {
      startQuiz(
        customFlowConfig
          ? { ...subject, flowConfig: customFlowConfig }
          : subject,
      )
      setPreparing(false)
    }, ms)
    return () => clearTimeout(timeout)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, location.state])

  // 準備畫面的進度條：隨機分段跑滿，在畫面淡出前跑完
  useEffect(() => {
    const bar = prepareBarRef.current
    if (!preparing || !bar) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const animation = bar.animate(randomPrepareFrames(), {
      duration: prepareMs - 300,
      fill: 'forwards',
    })
    return () => animation.cancel()
  }, [preparing, prepareMs])

  //* 計算是否所有題目都已回答完畢（包含所有階段）
  const isAllQuestionsCompleted = useMemo(() => {
    // 確保 allStagesQuestions 已初始化
    if (
      !quizState.allStagesQuestions ||
      Object.keys(quizState.allStagesQuestions).length === 0
    ) {
      return false
    }

    // 每階段獨立判定：當前 stage 的每一題在該 stage 都要有答案
    return Object.entries(quizState.allStagesQuestions).every(
      ([stageId, questions]) =>
        questions.every(
          (question) =>
            quizState.answers[answerKey(stageId, question.id)] !== undefined,
        ),
    )
  }, [quizState.allStagesQuestions, quizState.answers])

  //* 計算「當前階段」是否全部回答完畢（用於顯示「下一階段」按鈕）
  const isCurrentStageCompleted = useMemo(() => {
    // 確保 currentQuestions 已初始化
    if (
      !quizState.currentQuestions ||
      quizState.currentQuestions.length === 0 ||
      !quizState.currentStage?.stageId
    ) {
      return false
    }

    const stageId = quizState.currentStage.stageId
    // 檢查當前階段的所有題目是否都已回答（用 compound key）
    return quizState.currentQuestions.every(
      (question) =>
        quizState.answers[answerKey(stageId, question.id)] !== undefined,
    )
  }, [quizState.currentQuestions, quizState.answers, quizState.currentStage])

  // 當前階段已作答的題數（進度條）
  const answeredCount = quizState.currentQuestions.filter(
    (question) =>
      quizState.answers[
        answerKey(quizState.currentStage.stageId, question.id)
      ] !== undefined,
  ).length

  //* 即時回饋（錯題複習）
  const instant = quizState.flowConfig.instantFeedback === true
  const retrying = isRetryStage(quizState.currentStage.stageId ?? '')
  // 進入再練一次之前，先顯示過渡畫面
  const showRetryIntro =
    retrying && retryIntroDone !== quizState.currentStage.stageId
  const currentQuestion =
    quizState.currentQuestions[quizState.currentQuestionIndex]
  const currentKey = currentQuestion
    ? answerKey(quizState.currentStage.stageId, currentQuestion.id)
    : ''
  // 目前這題檢查的結果（還沒檢查是 undefined）
  const currentFeedback: boolean | undefined = quizState.feedback?.[currentKey]
  // 進度：第一輪答對的、以及再練過的題目才算完成，答錯的要等再練一次後才填滿
  const progress = (() => {
    if (!instant) {
      return { done: answeredCount, total: quizState.currentQuestions.length }
    }
    const stageId = baseStageId(quizState.currentStage.stageId)
    const firstRound = quizState.allStagesQuestions[stageId] ?? []
    const done = firstRound.filter(
      (question) =>
        quizState.feedback[answerKey(stageId, question.id)] === true ||
        answerKey(retryStageId(stageId), question.id) in quizState.feedback,
    ).length
    return { done, total: firstRound.length }
  })()

  // 按「繼續」：全部做完就交卷
  const handleContinue = (): void => {
    if (continueFeedback() === 'finish') handleFinish()
  }

  // 進入下一階段
  const handleNextStage = (): void => {
    const hasNext = finishStage()
    if (!hasNext) {
      console.log('所有階段完成')
    }
  }

  /**
   * [function] handleStageTimeUp
   * 階段時間到的處理：
   * - enforceStageTimer 為 true：強制進入下一階段；若為最後階段則結算整份測驗
   * - enforceStageTimer 為 false：維持舊行為（總計時器，時間到直接結算）
   */
  const handleStageTimeUp = (): void => {
    const enforce = quizState.flowConfig.enforceStageTimer === true
    if (!enforce) {
      handleFinish(true)
      return
    }

    if (hasNextStage()) {
      // 按下確定才進入下一階段，下一階段的計時從那時開始
      void showAlert('準備好就開始下一階段，計時會在按下後開始。', {
        title: '本階段時間到',
        confirmText: '開始下一階段',
      }).then(finishStage)
    } else {
      // 最後一階段時間到 → 強制結算整份
      handleFinish(true)
    }
  }

  /**
   * [function] handleFinish
   * 完成測驗
   * @param {boolean} force - 是否強制完成測驗
   * @returns {void}
   */
  const handleFinish = (force: boolean = false): void => {
    // 確保 allStagesQuestions 已初始化
    if (
      !quizState.allStagesQuestions ||
      Object.keys(quizState.allStagesQuestions).length === 0
    ) {
      return
    }

    // 檢查所有階段的所有題目是否都已回答（每階段獨立檢查）
    const allAnswered = Object.entries(quizState.allStagesQuestions).every(
      ([stageId, questions]) =>
        questions.every(
          (question) =>
            quizState.answers[answerKey(stageId, question.id)] !== undefined,
        ),
    )

    if (!allAnswered) {
      if (force) {
        // 時間到，強制完成
        const recordId = finishQuiz()
        // 如果測驗完成，則導航到歷史頁面
        if (recordId) {
          navigate(`/history/${recordId}`)
        } else {
          navigate('/history')
        }
      } else {
        // 時間未到，但未回答所有問題
        setPreviewAllQuestions(true)
        void showAlert('請回答所有問題')
        return
      }
    } else {
      // 所有問題都已回答，可以完成測驗
      const recordId = finishQuiz()
      // 如果測驗完成，則導航到歷史頁面
      if (recordId) {
        navigate(`/history/${recordId}`)
      } else {
        navigate('/history')
      }
    }
  }

  //* PVQC 題目生成並暫存
  const pvqcOptionsCache = useMemo(() => {
    const cache: Record<string, string[]> = {}
    const { currentQuestions, currentStage } = quizState

    // 只為 PVQC 選擇題生成選項緩存
    if (
      [
        'pvqc_read',
        'pvqc_listen_chinese',
        'pvqc_listen_english',
        'pvqc_pronunciation',
        'pvqc_read_listen',
      ].includes(currentStage.mode)
    ) {
      // 干擾選項從整個科目的單字庫抽：錯題複習的階段可能只有一兩題
      const allVocabQuestions = (subject?.questions ?? currentQuestions).filter(
        (q) => q.type === 'vocabulary',
      ) as VocabularyQuestion[]

      // 遍歷當前階段的單字題目
      currentQuestions.forEach((question) => {
        if (question.type === 'vocabulary') {
          const vocabQuestion = question as VocabularyQuestion

          if (
            currentStage.mode === 'pvqc_pronunciation' ||
            currentStage.mode === 'pvqc_read_listen'
          ) {
            // 生成發音選項
            const { options } = generatePVQCPronunciationOptions(
              vocabQuestion,
              allVocabQuestions,
            )
            // 緩存發音選項
            cache[question.id] = options
          } else if (
            [
              'pvqc_read',
              'pvqc_listen_chinese',
              'pvqc_listen_english',
            ].includes(currentStage.mode)
          ) {
            // 生成文字選項
            const { options } = generatePVQCOptions(
              vocabQuestion,
              allVocabQuestions,
              currentStage.mode as
                | 'pvqc_read'
                | 'pvqc_listen_chinese'
                | 'pvqc_listen_english',
            )
            // 緩存文字選項
            cache[question.id] = options
          }
        }
      })
    }

    return cache
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizState.currentQuestions, quizState.currentStage.mode]) // 只在題目列表或模式改變時重新生成

  //* 渲染測驗類型
  const renderQuizType = (): React.ReactElement | null => {
    const { currentStage } = quizState
    if (currentStage.mode === 'pvqc_write') {
      return <p className="quiz-type">PVQC 測驗一：寫</p>
    }
    if (currentStage.mode === 'pvqc_read') {
      return <p className="quiz-type">PVQC 測驗二：讀</p>
    }
    if (currentStage.mode === 'pvqc_listen_chinese') {
      return <p className="quiz-type">PVQC 測驗三：聽</p>
    }
    if (currentStage.mode === 'pvqc_listen_english') {
      return <p className="quiz-type">PVQC 測驗四：聽</p>
    }
    if (currentStage.mode === 'pvqc_pronunciation') {
      return <p className="quiz-type">PVQC 測驗五：聽</p>
    }
    if (currentStage.mode === 'pvqc_read_listen') {
      return <p className="quiz-type">PVQC 測驗六：讀聽</p>
    }
    return null
  }

  //* 關閉預覽所有問題
  const closePreviewAllQuestions = (): void => {
    setPreviewAllQuestions(false)
  }

  //* 根據模式渲染題目
  const renderQuestionByMode = (): React.ReactElement | null => {
    const { currentStage, currentQuestions, currentQuestionIndex, answers } =
      quizState
    const question = currentQuestions[currentQuestionIndex]

    if (!question) return null

    // 取得當前題目已儲存的答案（compound key，避免跨階段污染）
    const currentAnswer =
      answers[answerKey(currentStage.stageId, question.id)]?.answer

    // 如果是單字題，根據模式選擇對應的元件
    if (question.type === 'vocabulary') {
      const vocabQuestion = question as VocabularyQuestion

      switch (currentStage.mode) {
        case 'pvqc_write':
          return (
            <PVQCWriteQuestion
              question={vocabQuestion}
              currentAnswer={currentAnswer as string}
              onSubmit={submitAnswer}
              onNext={handleNext}
            />
          )

        case 'pvqc_read':
          return (
            <PVQCReadQuestion
              question={vocabQuestion}
              options={pvqcOptionsCache[question.id] || []}
              currentAnswer={currentAnswer as string}
              onSubmit={submitAnswer}
            />
          )

        case 'pvqc_listen_chinese':
        case 'pvqc_listen_english':
          return (
            <PVQCListenQuestion
              question={vocabQuestion}
              options={pvqcOptionsCache[question.id] || []}
              mode={currentStage.mode as any}
              currentAnswer={currentAnswer as string}
              onSubmit={(id, answer) => submitAnswer(id, answer)}
            />
          )

        case 'pvqc_pronunciation':
          return (
            <PVQCPronunciationQuestion
              question={vocabQuestion}
              pronunciationOptions={pvqcOptionsCache[question.id] || []}
              currentAnswer={currentAnswer as string}
              onSubmit={submitAnswer}
            />
          )

        case 'pvqc_read_listen':
          return (
            <PVQCReadListenQuestion
              question={vocabQuestion}
              pronunciationOptions={pvqcOptionsCache[question.id] || []}
              currentAnswer={currentAnswer as string}
              onSubmit={submitAnswer}
            />
          )

        default:
          return (
            <StandardQuestion
              question={question}
              currentAnswer={currentAnswer}
              onSubmit={(id, answer) => submitAnswer(id, answer)}
            />
          )
      }
    }

    // 其他題型使用標準元件；同一階段有多種題型時，標出這題的題型
    const isMixed = new Set(currentQuestions.map((q) => q.type)).size > 1
    return (
      <StandardQuestion
        question={question}
        currentAnswer={currentAnswer}
        typeLabel={isMixed ? QUESTION_TYPE_LABELS[question.type] : undefined}
        reveal={instant && currentFeedback !== undefined}
        onSubmit={(id, answer) => submitAnswer(id, answer)}
      />
    )
  }
  return (
    <div className={`page${subjectId ? ' quiz-page' : ''}`}>
      <div
        className={`page-container${subjectId ? ' quiz-container' : ''}${
          subjectId && instant && !preparing ? ' instant-feedback' : ''
        }`}
      >
        {subjectId ? (
          subject && preparing ? (
            //* 正在準備：顯示科目、題數與時間
            <div
              className={`quiz-preparing${
                flowConfig?.flowMode === 'review' ? ' review' : ''
              }`}
              role="status"
              // 最後 0.2 秒淡出（見 Quiz.scss）
              style={
                {
                  '--prepare-out': `${prepareMs - 200}ms`,
                } as React.CSSProperties
              }
            >
              <span className="quiz-preparing-icon material-symbols-rounded fill">
                {flowConfig?.flowMode === 'review'
                  ? 'replay'
                  : 'assignment_turned_in'}
              </span>
              <p className="quiz-preparing-name">{subject.name}</p>
              <p className="quiz-preparing-meta">
                {(() => {
                  const count = (flowConfig?.stages ?? []).reduce(
                    (sum, stage) => sum + stage.questionCount,
                    0,
                  )
                  const minutes = flowConfig?.totalTimeLimit ?? 0
                  if (flowConfig?.flowMode === 'review') {
                    return `錯題複習・${count} 題`
                  }
                  return minutes > 0
                    ? `${count} 題・${minutes} 分鐘`
                    : `${count} 題`
                })()}
              </p>
              <div className="quiz-preparing-bar">
                <div ref={prepareBarRef} />
              </div>
              <p className="quiz-preparing-hint">正在準備題目</p>
            </div>
          ) : subject && showRetryIntro ? (
            //* 再練一次的過渡畫面
            <div className="quiz-retry-intro" role="status">
              <span className="quiz-retry-intro-icon material-symbols-rounded">
                replay
              </span>
              <p className="quiz-retry-intro-title">再練一次</p>
              <p className="quiz-retry-intro-text">
                剛剛答錯的 {quizState.currentQuestions.length}{' '}
                題，再練一次加深印象
              </p>
              <button
                className="quiz-retry-intro-btn"
                onClick={() =>
                  setRetryIntroDone(quizState.currentStage.stageId)
                }
                autoFocus
              >
                繼續
              </button>
            </div>
          ) : subject ? (
            //* 如果有 subjectId，顯示測驗頁面
            <>
              <div className="question-section">
                <div className="question-header">
                  {/* 進度條（當前階段完成的比例），計時器在右側；再練一次時改橘色 */}
                  <div className="quiz-progress-row">
                    <div
                      className={`quiz-progress${retrying ? ' retry' : ''}`}
                      role="progressbar"
                      aria-label="作答進度"
                      aria-valuemin={0}
                      aria-valuemax={progress.total}
                      aria-valuenow={progress.done}
                    >
                      <div
                        style={{
                          width: `${
                            (progress.done / Math.max(progress.total, 1)) * 100
                          }%`,
                        }}
                      />
                    </div>
                    {(() => {
                      const enforce =
                        quizState.flowConfig.enforceStageTimer === true
                      const stage = quizState.currentStage
                      // 啟用分階段強制計時 → 用當前階段 timeLimit
                      // 未啟用 → 沿用舊行為（總時長一次倒數）
                      const duration = enforce
                        ? stage.timeLimit
                        : quizState.flowConfig.totalTimeLimit
                      const timerKey = enforce
                        ? `stage-${stage.stageId}`
                        : `total-${quizState.flowConfig.totalTimeLimit}`
                      return (
                        duration > 0 && (
                          <Timer
                            key={timerKey}
                            duration={duration}
                            onTimeUp={
                              enforce
                                ? handleStageTimeUp
                                : () => handleFinish(true)
                            }
                          />
                        )
                      )
                    })()}
                  </div>
                  {renderQuizType()}
                  {(quizState.flowConfig.stages?.length ?? 0) > 1 && (
                    <p className="stage-progress">
                      階段 {quizState.currentStageIndex + 1} /{' '}
                      {quizState.flowConfig.stages.length}
                      {quizState.currentStage?.label && (
                        <span className="stage-label">
                          {' · '}
                          {quizState.currentStage.label}
                        </span>
                      )}
                    </p>
                  )}
                  {retrying && (
                    <p className="quiz-retry-label">
                      <span className="material-symbols-rounded">replay</span>
                      再練一次
                    </p>
                  )}
                  <h2>
                    {quizState.currentQuestionIndex + 1}{' '}
                    <span className="question-count">
                      / {quizState.currentQuestions.length}
                    </span>
                  </h2>
                </div>

                {/* 題目渲染系統 */}
                {renderQuestionByMode()}
              </div>

              {instant ? (
                //* 即時回饋：檢查按鈕或結果列（不能回上一題，也沒有題目總覽）
                <div className="quiz-navigation">
                  {currentFeedback !== undefined && currentQuestion ? (
                    <div
                      className={`quiz-feedback ${
                        currentFeedback ? 'correct' : 'wrong'
                      }`}
                      role="status"
                    >
                      <p className="quiz-feedback-title">
                        <span className="material-symbols-rounded">
                          {currentFeedback ? 'check' : 'close'}
                        </span>
                        {currentFeedback ? '答對了！' : '答錯了'}
                      </p>
                      {!currentFeedback && (
                        <div className="quiz-feedback-answer">
                          <p>正確答案</p>
                          <CorrectAnswers question={currentQuestion} />
                        </div>
                      )}
                      <button
                        className="quiz-feedback-btn"
                        onClick={handleContinue}
                        autoFocus
                      >
                        繼續
                      </button>
                    </div>
                  ) : (
                    currentQuestion?.type === 'multiple_choice' && (
                      <button
                        className="quiz-check-btn"
                        onClick={checkAnswer}
                        disabled={
                          !(
                            quizState.answers[currentKey]?.answer as
                              | number[]
                              | undefined
                          )?.length
                        }
                      >
                        檢查
                      </button>
                    )
                  )}
                </div>
              ) : (
                /* 測驗導航 */
                <div className="quiz-navigation">
                  <div className="quiz-buttons">
                    <button onClick={handlePrev} title="上一題">
                      <span className="material-symbols-rounded">
                        arrow_back
                      </span>
                    </button>
                    <button
                      onClick={() => handleNext()}
                      title="下一題"
                      className={
                        quizState.currentStage.mode === 'pvqc_pronunciation' ||
                        quizState.currentStage.mode === 'pvqc_read_listen'
                          ? 'manual-next-button'
                          : undefined
                      }
                    >
                      <span className="material-symbols-rounded">
                        arrow_forward
                      </span>
                    </button>
                    <button
                      className={`preview-all-questions-btn${
                        previewAllQuestions ? ' active' : ''
                      }`}
                      onClick={() =>
                        setPreviewAllQuestions(!previewAllQuestions)
                      }
                      title={
                        previewAllQuestions ? '關閉題目預覽' : '預覽全部題目'
                      }
                    >
                      <span
                        className={`material-symbols-rounded ${
                          previewAllQuestions ? 'fill' : ''
                        }`}
                      >
                        apps
                      </span>
                    </button>
                    {isAllQuestionsCompleted && (
                      <button
                        onClick={() => {
                          handleFinish()
                        }}
                        className="finish-button"
                        disabled={!isAllQuestionsCompleted}
                      >
                        完成測驗
                      </button>
                    )}
                    {isCurrentStageCompleted && hasNextStage() && (
                      <button
                        onClick={handleNextStage}
                        className="next-stage-button"
                      >
                        下一階段
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            //* 科目不存在的錯誤處理
            <div className="error-message">
              <h2>找不到指定的測驗科目</h2>
              <Link to="/quiz" className="no-style">
                <button>返回測驗列表</button>
              </Link>
            </div>
          )
        ) : (
          //* 如果沒有 subjectId，顯示科目列表
          <>
            <h1 className="quiz-to-history">
              測驗
              <Link to="/history" className="no-style">
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
                {wrongGroups.length > 0 ? (
                  <>
                    <strong>
                      {wrongGroups.reduce((sum, g) => sum + g.items.length, 0)}
                    </strong>{' '}
                    題待複習
                  </>
                ) : (
                  '目前沒有錯題'
                )}
              </span>
              <span className="review-entry-arrow material-symbols-rounded">
                chevron_right
              </span>
            </Link>

            {/* PVQC 測驗入口：要先經過設定頁，所以整列是連結，以向右箭頭表示進到下一層 */}
            <Link className="pvqc-entry no-style" to="/pvqc">
              <span className="hot-badge">HOT</span>
              <span className="pvqc-entry-title">
                <span className="material-symbols-rounded">psychology</span>
                PVQC 測驗
              </span>
              <span className="pvqc-entry-arrow material-symbols-rounded">
                chevron_right
              </span>
            </Link>

            {/* 科目列表 */}
            <div className="subject-list">
              {quizSections.map(({ group, subjects: members }) => {
                const cards = members.map((subject) => {
                  // 計算總題數（所有階段的題數總和）
                  const totalQuestions = subject.flowConfig.stages.reduce(
                    (sum, stage) => sum + stage.questionCount,
                    0,
                  )

                  return (
                    <div key={subject.id} className="subject-card">
                      <p className="subject-name">{subject.name}</p>
                      <div className="subject-card-content">
                        <div className="subject-info">
                          <p>{totalQuestions} 題</p>
                          <p>{subject.flowConfig.totalTimeLimit} 分鐘</p>
                        </div>
                        <button
                          className="start-quiz-btn"
                          onClick={() => {
                            if (isSubjectLocked(subject)) {
                              void showAlert(
                                '此科目目前處於鎖定狀態，無法完成測驗',
                              )
                              return
                            }
                            navigate(`/quiz/${subject.id}`)
                          }}
                        >
                          <span className="material-symbols-rounded fill">
                            play_arrow
                          </span>
                          {/* 開始測驗 */}
                        </button>
                      </div>
                    </div>
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
          </>
        )}
        {/* 預覽所有題目的彈窗 */}
        {previewAllQuestions && (
          <PreviewAllQuestions
            close={closePreviewAllQuestions}
            pvqcOptionsCache={pvqcOptionsCache}
          />
        )}
      </div>
    </div>
  )
}

/**
 * [component] PreviewAllQuestions component
 * 預覽所有題目的彈窗元件
 * @param close - 關閉彈窗
 * @param pvqcOptionsCache - PVQC 選項緩存
 * @returns 預覽所有題目的彈窗元件
 */
const PreviewAllQuestions: React.FC<PreviewAllQuestionsProps> = ({
  close,
  pvqcOptionsCache,
}) => {
  const { handleNext, quizState } = useQuiz()
  const {
    currentQuestions: questions,
    answers,
    currentQuestionIndex,
    currentStage,
  } = quizState

  // 當前階段的 compound key 前綴
  const stageId = currentStage?.stageId || ''

  const handleQuestionClick = (index: number): void => {
    // 設置當前問題索引
    handleNext(index)
  }

  const getAnswerDisplay = (questionId: string): string | null => {
    const answerData = answers[answerKey(stageId, questionId)]
    if (!answerData) return null

    // 使用新的答案格式
    const answer = answerData.answer

    if (typeof answer === 'number') {
      return String.fromCharCode(65 + answer)
    } else if (Array.isArray(answer)) {
      return answer
        .map((idx) => String.fromCharCode(65 + idx))
        .sort((a, b) => a.localeCompare(b))
        .join(', ')
    } else if (typeof answer === 'boolean') {
      return answer ? 'O' : 'X'
    } else if (typeof answer === 'string') {
      const options = pvqcOptionsCache[questionId]
      // 如果是寫題，
      if (quizState.currentStage.mode === 'pvqc_write') {
        return answer
      }
      // 如果是選擇題，顯示選項
      if (options && options.length > 0) {
        const index = options.indexOf(answer)
        if (index >= 0) {
          return String.fromCharCode(65 + index)
        }
      }
      // 其他情況，顯示前 10 個字符
      return answer.length > 10 ? answer.substring(0, 10) + '...' : answer
    }

    return null
  }

  return (
    <div className="preview-all-questions">
      <h2>預覽題目</h2>
      <div
        className={`questions-grid ${
          quizState.currentStage.mode === 'pvqc_write' ? 'write-question' : ''
        } ${
          questions.some((q) => q.type === 'multiple_choice')
            ? 'multiple-choice-question'
            : ''
        }`}
      >
        {questions.map((question, index) => {
          const isAnswered =
            answers[answerKey(stageId, question.id)] !== undefined
          const isCurrentQuestion = index === currentQuestionIndex
          const answerDisplay = getAnswerDisplay(question.id)

          return (
            <div
              key={question.id}
              className={`question-item${isAnswered ? ' answered' : ''}${
                isCurrentQuestion ? ' current' : ''
              }${(index + 1) % 5 === 0 ? ' five-in-row' : ''}`}
              onClick={() => {
                handleQuestionClick(index)
                close()
              }}
            >
              <span className="question-number">{index + 1}</span>
              {isAnswered && answerDisplay && (
                <span className={`question-answer`}>{answerDisplay}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Quiz
