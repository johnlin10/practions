import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './Results.scss'
import '../../styles/reviewQuestions.scss'

// context
import { useQuiz } from '../../context/QuizContext'
import { Question } from '../../types/questions'
import { DetailedQuestionResult } from '../../types'
import { getStageDisplayName } from '../../utils/detailed-results'

//* 分析後的題目型別（直接沿用 detailed-results 的判定）
type AnalyzedQuestion = {
  question: Question
  userAnswer: string | number | number[] | boolean | undefined
  isCorrect: boolean
  isUnanswered: boolean
}

//* 分組後的題目型別
type QuestionGroup = {
  title: string
  questions: AnalyzedQuestion[]
  stageId?: string
  mode?: string
  correctCount?: number
  totalCount?: number
  passingScore?: number
  passed?: boolean
}

const toAnalyzed = (q: DetailedQuestionResult): AnalyzedQuestion => ({
  question: q.question,
  userAnswer: q.userAnswer,
  isCorrect: q.isCorrect,
  isUnanswered: q.isUnanswered,
})

/**
 * Results component
 * 顯示測驗結果，包含答題分析和篩選功能
 */
function Results(): React.ReactElement {
  const navigate = useNavigate()
  const { quizState } = useQuiz()
  const [showWrongOnly, setShowWrongOnly] = useState<boolean>(false)
  const [sortByQuestionId, setSortByQuestionId] = useState<boolean>(false)

  const results = quizState.results

  //* 計算測驗持續時間
  const duration =
    quizState.endTime && quizState.startTime
      ? quizState.endTime.getTime() - quizState.startTime.getTime()
      : 0
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)

  //* 直接讀取 detailed-results 的判定（單一資料來源）
  const analyzedQuestions = useMemo<AnalyzedQuestion[]>(() => {
    if (!results) return []
    if (results.stageResults) {
      return results.stageResults.flatMap((s) =>
        s.questionResults.map(toAnalyzed)
      )
    }
    return (results.questionResults ?? []).map(toAnalyzed)
  }, [results])

  //* 使用 useMemo 處理分組和篩選
  const questionGroups = useMemo<QuestionGroup[]>(() => {
    if (!results) return []

    const applyFilterAndSort = (questions: AnalyzedQuestion[]): AnalyzedQuestion[] => {
      let filtered = showWrongOnly
        ? questions.filter((q) => !q.isCorrect)
        : questions.slice()
      if (sortByQuestionId) {
        filtered.sort((a, b) => {
          const aNum = parseInt(a.question.id.toString().replace(/\D/g, '')) || 0
          const bNum = parseInt(b.question.id.toString().replace(/\D/g, '')) || 0
          return aNum - bNum
        })
      }
      return filtered
    }

    // PVQC 多階段：按 stageResults 分組
    if (results.stageResults) {
      return results.stageResults
        .map((stage, index): QuestionGroup => {
          const analyzed = stage.questionResults.map(toAnalyzed)
          return {
            title: stage.label || getStageDisplayName(stage.mode, index),
            questions: applyFilterAndSort(analyzed),
            stageId: stage.stageId,
            mode: stage.mode,
            correctCount: stage.correctCount,
            totalCount: stage.totalCount,
            passingScore: stage.passingScore,
            passed: stage.passed,
          }
        })
        .filter((group) => group.questions.length > 0)
    }

    // 單階段：按題型分組
    const typeNameOf = (t: Question['type']): string =>
      t === 'single_choice'
        ? '單選題'
        : t === 'multiple_choice'
        ? '多選題'
        : t === 'true_false'
        ? '是非題'
        : t === 'vocabulary'
        ? '單字題'
        : '其他題型'

    const groupedByType: Record<string, AnalyzedQuestion[]> = {}
    analyzedQuestions.forEach((q) => {
      const name = typeNameOf(q.question.type)
      ;(groupedByType[name] = groupedByType[name] || []).push(q)
    })

    return Object.entries(groupedByType)
      .map(([typeName, questions]) => ({
        title: typeName,
        questions: applyFilterAndSort(questions),
      }))
      .filter((group) => group.questions.length > 0)
  }, [results, analyzedQuestions, showWrongOnly, sortByQuestionId])

  //* 渲染正確答案
  const renderCorrectAnswer = (question: Question): string => {
    switch (question.type) {
      case 'single_choice':
        return String.fromCharCode(65 + question.correctIndex)

      case 'multiple_choice':
        return question.correctIndexes
          .map((idx) => String.fromCharCode(65 + idx))
          .join(', ')

      case 'true_false':
        return question.correctAnswer ? 'O（正確）' : 'X（錯誤）'

      case 'vocabulary':
        return question.english

      default:
        return '未知'
    }
  }

  //* 渲染選項
  const renderOptions = (analyzed: AnalyzedQuestion): React.ReactNode => {
    const { question, userAnswer } = analyzed

    switch (question.type) {
      case 'single_choice':
        return (
          <div className="options">
            {question.options.map((option, idx) => {
              const isUserAnswer = userAnswer === idx
              const isCorrectAnswer = idx === question.correctIndex

              return (
                <div
                  key={idx}
                  className={`option ${isUserAnswer ? 'user-answer' : ''} ${
                    isCorrectAnswer ? 'correct-answer' : ''
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                </div>
              )
            })}
          </div>
        )

      case 'multiple_choice':
        return (
          <div className="options">
            {question.options.map((option, idx) => {
              const isUserAnswer =
                Array.isArray(userAnswer) && userAnswer.includes(idx)
              const isCorrectAnswer = question.correctIndexes.includes(idx)

              return (
                <div
                  key={idx}
                  className={`option ${isUserAnswer ? 'user-answer' : ''} ${
                    isCorrectAnswer ? 'correct-answer' : ''
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                </div>
              )
            })}
          </div>
        )

      case 'true_false':
        return (
          <div className="options">
            <div
              className={`option ${userAnswer === true ? 'user-answer' : ''} ${
                question.correctAnswer ? 'correct-answer' : ''
              }`}
            >
              O. 正確
            </div>
            <div
              className={`option ${userAnswer === false ? 'user-answer' : ''} ${
                !question.correctAnswer ? 'correct-answer' : ''
              }`}
            >
              X. 錯誤
            </div>
          </div>
        )

      case 'vocabulary':
        // 判斷答案類型並顯示
        let answerDisplay = '未作答'
        if (typeof userAnswer === 'string') {
          // 檢查是否為音訊檔案路徑
          if (userAnswer.includes('.mp3') || userAnswer.includes('/audio/')) {
            answerDisplay = `發音選項: ${userAnswer.split('/').pop()}`
          } else {
            answerDisplay = userAnswer
          }
        }

        return (
          <div className="vocabulary-display">
            <p>
              <strong>英文：</strong>
              {question.english}
            </p>
            <p>
              <strong>中文：</strong>
              {question.chinese}
            </p>
            <p>
              <strong>你的答案：</strong>
              {answerDisplay}
            </p>
          </div>
        )

      default:
        return null
    }
  }

  //* 渲染題目文字
  const renderQuestionText = (question: Question): string => {
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'true_false':
        return question.question

      case 'vocabulary':
        return `${question.chinese} (${question.english})`

      default:
        return '未知題目'
    }
  }

  const handleClose = (): void => {
    navigate('/quiz')
  }

  // 如果沒有結果，顯示載入中
  if (!results) {
    return <div>載入中...</div>
  }

  const correctCount = analyzedQuestions.filter((q) => q.isCorrect).length
  const totalQuestions = analyzedQuestions.length

  const flowMode = quizState.flowConfig.flowMode
  const isOfficial = flowMode === 'pvqc_official'
  const overallPassed = results.overallPassed

  return (
    <div className="results-page">
      <div className="review-questions-container">
        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
        <div className="review-questions-header">
          <h2>測驗結果</h2>
        </div>

        {isOfficial && typeof overallPassed === 'boolean' && (
          <div
            className={`official-banner ${
              overallPassed ? 'passed' : 'failed'
            }`}
          >
            <span className="material-symbols-rounded fill">
              {overallPassed ? 'verified' : 'cancel'}
            </span>
            <span className="banner-text">
              {overallPassed
                ? 'PASS · 通過 PVQC 官方模擬'
                : 'FAIL · 未通過 PVQC 官方模擬'}
            </span>
          </div>
        )}

        <div className="summary">
          <h1>
            {results.overallCorrectRate}{' '}
            <span>
              {correctCount}/{totalQuestions}
            </span>
          </h1>
          <p>
            用時 {minutes} 分 {seconds} 秒
          </p>
        </div>

        <div className="filters">
          <div
            className={`filter-switch ${showWrongOnly ? 'active' : ''}`}
            onClick={() => setShowWrongOnly(!showWrongOnly)}
          >
            <span className="material-symbols-rounded fill">filter_list</span>
            <p>只顯示錯誤題目</p>
          </div>
          <div
            className={`filter-switch ${sortByQuestionId ? 'active' : ''}`}
            onClick={() => setSortByQuestionId(!sortByQuestionId)}
          >
            <span className="material-symbols-outlined">swap_vert</span>
            <p>依題號排序</p>
          </div>
        </div>

        <div className="questions-review">
          {questionGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="question-group">
              <div className="group-header">
                <h2 className="group-title">{group.title}</h2>
                {typeof group.correctCount === 'number' &&
                  typeof group.totalCount === 'number' && (
                    <div
                      className={`stage-badge ${
                        group.passed === true
                          ? 'passed'
                          : group.passed === false
                          ? 'failed'
                          : ''
                      }`}
                    >
                      <span className="stage-score">
                        {group.correctCount}/{group.totalCount}
                      </span>
                      {typeof group.passingScore === 'number' && (
                        <span className="stage-threshold">
                          （及格 {group.passingScore}）
                        </span>
                      )}
                      {typeof group.passed === 'boolean' && (
                        <span className="stage-passed">
                          {group.passed ? '✓ 通過' : '✗ 未通過'}
                        </span>
                      )}
                    </div>
                  )}
              </div>
              <div className="group-questions">
                {group.questions.map((analyzed) => (
                  <div
                    key={analyzed.question.id}
                    className={`question-item ${
                      analyzed.isCorrect ? 'correct' : 'wrong'
                    } ${analyzed.isUnanswered ? 'unanswered' : ''}`}
                  >
                    <h3>#{analyzed.question.id}</h3>
                    <div
                      className={`answer-status ${
                        analyzed.isCorrect ? 'correct' : 'wrong'
                      }`}
                    >
                      {analyzed.isUnanswered ? (
                        '未作答'
                      ) : analyzed.isCorrect ? (
                        <>
                          <span className="material-symbols-rounded fill">
                            check
                          </span>
                          答對
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-rounded fill">
                            close
                          </span>
                          答錯（正確答案:{' '}
                          {renderCorrectAnswer(analyzed.question)}）
                        </>
                      )}
                    </div>
                    <p>{renderQuestionText(analyzed.question)}</p>
                    {renderOptions(analyzed)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Results
