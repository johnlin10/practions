import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './Results.scss'
import '../../styles/reviewQuestions.scss'

// context
import { useQuiz } from '../../context/QuizContext'
import { Question } from '../../types/questions'
import { getStageDisplayName } from '../../utils/detailed-results'

//* 分析後的題目型別
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
}

/**
 * Results component
 * 顯示測驗結果，包含答題分析和篩選功能
 */
function Results(): React.ReactElement {
  const navigate = useNavigate()
  const { quizState } = useQuiz()
  const [showWrongOnly, setShowWrongOnly] = useState<boolean>(false)
  const [sortByQuestionId, setSortByQuestionId] = useState<boolean>(false)
  const [analyzedQuestions, setAnalyzedQuestions] = useState<
    AnalyzedQuestion[]
  >([])

  //* 計算測驗持續時間
  const duration =
    quizState.endTime && quizState.startTime
      ? quizState.endTime.getTime() - quizState.startTime.getTime()
      : 0
  const minutes = Math.floor(duration / 60000)
  const seconds = Math.floor((duration % 60000) / 1000)

  //* 分析題目和答案
  useEffect(() => {
    // 檢查是否有結果資料
    if (!quizState.results) {
      navigate('/')
      return
    }

    // 收集所有階段的題目
    const allQuestions: Question[] = []
    Object.values(quizState.allStagesQuestions).forEach((stageQuestions) => {
      allQuestions.push(...stageQuestions)
    })

    const analyzed: AnalyzedQuestion[] = allQuestions.map((question) => {
      const answerRecord = quizState.answers[question.id]
      const userAnswer = answerRecord?.answer

      // 判斷是否正確
      let isCorrect = false

      if (answerRecord) {
        switch (question.type) {
          case 'single_choice':
            isCorrect =
              typeof userAnswer === 'number' &&
              userAnswer === question.correctIndex
            break

          case 'multiple_choice':
            if (Array.isArray(userAnswer)) {
              isCorrect =
                userAnswer.length === question.correctIndexes.length &&
                userAnswer.every((ans) => question.correctIndexes.includes(ans))
            }
            break

          case 'true_false':
            isCorrect =
              typeof userAnswer === 'boolean' &&
              userAnswer === question.correctAnswer
            break

          case 'vocabulary':
            // 單字題的正確性判斷
            if (typeof userAnswer === 'string') {
              // 可能是拼寫題、選擇題或發音題
              // 拼寫題：比對英文單字
              const isWriteCorrect =
                userAnswer.trim().toLowerCase() ===
                question.english.trim().toLowerCase()
              // 選中文：比對中文翻譯
              const isChineseCorrect = userAnswer === question.chinese
              // 選英文：比對英文單字
              const isEnglishCorrect =
                userAnswer.trim().toLowerCase() ===
                question.english.trim().toLowerCase()
              // 發音題：比對音訊檔案
              const correctAudio =
                question.audioFile ||
                `/vocabulary-audio/${question.english}.mp3`
              const isPronunciationCorrect = userAnswer === correctAudio

              isCorrect =
                isWriteCorrect ||
                isChineseCorrect ||
                isEnglishCorrect ||
                isPronunciationCorrect
            }
            break
        }
      }

      return {
        question,
        userAnswer,
        isCorrect,
        isUnanswered: !answerRecord,
      }
    })

    setAnalyzedQuestions(analyzed)
  }, [quizState, navigate])

  //* 使用 useMemo 處理分組和篩選
  const questionGroups = useMemo<QuestionGroup[]>(() => {
    // 檢查是否為 PVQC 測驗（任何階段的模式以 'pvqc' 開頭）
    const isPVQC = quizState.flowConfig.stages.some((stage) =>
      stage.mode.startsWith('pvqc')
    )

    if (isPVQC) {
      // PVQC 測驗：按階段分組
      return quizState.flowConfig.stages
        .map((stage, index) => {
          const stageQuestions =
            quizState.allStagesQuestions[stage.stageId] || []
          const analyzedStageQuestions: AnalyzedQuestion[] = stageQuestions.map(
            (question) => {
              const answerRecord = quizState.answers[question.id]
              const userAnswer = answerRecord?.answer

              // 判斷是否正確（簡化版邏輯）
              let isCorrect = false
              if (answerRecord) {
                switch (question.type) {
                  case 'vocabulary':
                    if (typeof userAnswer === 'string') {
                      const isWriteCorrect =
                        userAnswer.trim().toLowerCase() ===
                        question.english.trim().toLowerCase()
                      const isChineseCorrect = userAnswer === question.chinese
                      const isEnglishCorrect =
                        userAnswer.trim().toLowerCase() ===
                        question.english.trim().toLowerCase()
                      const correctAudio =
                        question.audioFile ||
                        `/vocabulary-audio/${question.english}.mp3`
                      const isPronunciationCorrect = userAnswer === correctAudio
                      isCorrect =
                        isWriteCorrect ||
                        isChineseCorrect ||
                        isEnglishCorrect ||
                        isPronunciationCorrect
                    }
                    break
                  default:
                    // 其他題型使用簡單邏輯
                    isCorrect = true // 暫時設為 true，實際應該用詳細邏輯
                }
              }

              return {
                question,
                userAnswer,
                isCorrect,
                isUnanswered: !answerRecord,
              }
            }
          )

          // 應用篩選
          let filteredQuestions = analyzedStageQuestions
          if (showWrongOnly) {
            filteredQuestions = filteredQuestions.filter((q) => !q.isCorrect)
          }

          // 應用排序
          if (sortByQuestionId) {
            filteredQuestions.sort((a, b) => {
              const aNum =
                parseInt(a.question.id.toString().replace(/\D/g, '')) || 0
              const bNum =
                parseInt(b.question.id.toString().replace(/\D/g, '')) || 0
              return aNum - bNum
            })
          }

          return {
            title: getStageDisplayName(stage.mode, index),
            questions: filteredQuestions,
            stageId: stage.stageId,
            mode: stage.mode,
          }
        })
        .filter((group) => group.questions.length > 0) // 只顯示有題目的組
    } else {
      // Standard 測驗：按題型分組
      const groupedByType: Record<string, AnalyzedQuestion[]> = {}

      analyzedQuestions.forEach((analyzed) => {
        const typeName =
          analyzed.question.type === 'single_choice'
            ? '單選題'
            : analyzed.question.type === 'multiple_choice'
            ? '多選題'
            : analyzed.question.type === 'true_false'
            ? '是非題'
            : analyzed.question.type === 'vocabulary'
            ? '單字題'
            : '其他題型'

        if (!groupedByType[typeName]) {
          groupedByType[typeName] = []
        }
        groupedByType[typeName].push(analyzed)
      })

      return Object.entries(groupedByType)
        .map(([typeName, questions]) => {
          // 應用篩選
          let filteredQuestions = questions
          if (showWrongOnly) {
            filteredQuestions = filteredQuestions.filter((q) => !q.isCorrect)
          }

          // 應用排序
          if (sortByQuestionId) {
            filteredQuestions.sort((a, b) => {
              const aNum =
                parseInt(a.question.id.toString().replace(/\D/g, '')) || 0
              const bNum =
                parseInt(b.question.id.toString().replace(/\D/g, '')) || 0
              return aNum - bNum
            })
          }

          return {
            title: typeName,
            questions: filteredQuestions,
          }
        })
        .filter((group) => group.questions.length > 0) // 只顯示有題目的組
    }
  }, [quizState, analyzedQuestions, showWrongOnly, sortByQuestionId])

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
  if (!quizState.results) {
    return <div>載入中...</div>
  }

  const correctCount = analyzedQuestions.filter((q) => q.isCorrect).length
  const totalQuestions = analyzedQuestions.length

  return (
    <div className="results-page">
      <div className="review-questions-container">
        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>
        <div className="review-questions-header">
          <h2>測驗結果</h2>
        </div>

        <div className="summary">
          <h1>
            {quizState.results.overallCorrectRate}{' '}
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
              <h2 className="group-title">{group.title}</h2>
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
