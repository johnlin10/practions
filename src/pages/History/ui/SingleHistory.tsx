import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './SingleHistory.scss'

// utils
import { isSubjectLocked } from '../../Bank/utils/bankHelpers'
import { getStageDisplayName } from '../../../utils/detailed-results'
import { speakEnglish } from '../../../utils/tts'

// data
import { getHistoryById } from '@/data/historyStore'

// types
import { HistoryRecord, DetailedQuestionResult } from '../../../types'
import {
  Question,
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  VocabularyQuestion,
} from '../../../types/questions'
import { AnswerRecord } from '../../../types/answers'

// data
import { subjects } from '../../../data/subjects'

// interfaces
interface AnalyzedQuestion {
  question: Question
  userAnswer: string | number | number[] | boolean | undefined
  isCorrect: boolean
  isUnanswered: boolean
  stageId?: string // 適用於多階段測驗
}

interface QuestionGroup {
  title: string
  questions: AnalyzedQuestion[]
  stageId?: string
  mode?: string
  correctCount?: number
  totalCount?: number
  passingScore?: number
  passed?: boolean
}

interface HistoryParams extends Record<string, string | undefined> {
  id?: string
}

/**
 * [page] SingleHistory component
 * 單一歷史記錄詳細頁面
 */
function SingleHistory(): React.ReactElement {
  // 頁面載入動畫
  const [pageAnimation, setPageAnimation] = useState<boolean>(true)
  // 取得歷史記錄 ID
  const { id } = useParams<HistoryParams>()
  // 導航
  const navigate = useNavigate()
  // 歷史記錄
  const [record, setRecord] = useState<HistoryRecord | null>(null)
  // 是否只顯示錯誤題目
  const [showWrongOnly, setShowWrongOnly] = useState<boolean>(false)
  // 是否按題號排序
  const [sortByQuestionId, setSortByQuestionId] = useState<boolean>(false)

  // 頁面載入動畫
  useEffect(() => {
    setTimeout(() => {
      setPageAnimation(false)
    }, 100)
  }, [])

  // 獲取歷史記錄
  useEffect(() => {
    // 從資料層依 id 取得記錄
    const selectedRecord = getHistoryById(id ?? '')

    // 如果找不到指定 ID 的歷史記錄，則顯示錯誤訊息
    if (!selectedRecord) {
      // 顯示錯誤訊息
      console.warn('找不到指定的歷史記錄:', id)
      navigate('/history')
      setTimeout(() => {
        alert('找不到此歷史記錄')
      }, 100)
      return
    }

    // 確保 subject 資料存在
    if (!selectedRecord.subject || !selectedRecord.subject.id) {
      console.warn('歷史記錄中的 subject 資料不完整:', selectedRecord)
      navigate('/history')
      setTimeout(() => {
        alert('此歷史記錄資料不完整，無法查看')
      }, 100)
      return
    }

    /**
     * [function] checkLockStatus
     * 檢查科目是否鎖定
     * @returns {void}
     */
    const checkLockStatus = (): void => {
      // 取得科目
      const subject = subjects[selectedRecord.subject.id]
      // 如果科目存在且被鎖定，則顯示錯誤訊息
      if (subject && isSubjectLocked(subject)) {
        navigate('/history')
        setTimeout(() => {
          alert('此科目目前處於鎖定狀態，無法查看歷史紀錄')
        }, 100)
        return
      }
    }
    // 檢查科目是否鎖定
    checkLockStatus()
    // 每 5 秒檢查一次科目是否鎖定
    const intervalId = setInterval(checkLockStatus, 5000)
    // 設定歷史記錄
    setRecord(selectedRecord)
    // 清除每 5 秒檢查一次科目是否鎖定
    return () => clearInterval(intervalId)
  }, [id, navigate])

  /**
   * [function] handleClose
   * 處理關閉單一歷史記錄頁面
   * @returns {void}
   */
  const handleClose = (): void => {
    // 設定頁面動畫
    setPageAnimation(true)
    // 延遲 500 毫秒退出動畫後，跳轉到歷史記錄列表
    setTimeout(() => {
      navigate('/history')
    }, 500)
  }

  /**
   * [function] analyzedQuestions
   * 從儲存的詳細評分報告中獲取分析後的題目資料
   * @returns {AnalyzedQuestion[]} - 分析後的題目資料
   * @returns 分析後的題目資料
   */
  const analyzedQuestions = useMemo<AnalyzedQuestion[]>(() => {
    // 如果歷史記錄不存在，則返回空陣列
    if (!record) return []

    // 如果結果存在且有問題結果，則使用新的詳細評分報告格式
    if (record.results && record.results.questionResults) {
      // 返回新的詳細評分報告格式
      return record.results.questionResults.map(
        (result: DetailedQuestionResult) => ({
          question: result.question,
          userAnswer: result.userAnswer,
          isCorrect: result.isCorrect,
          isUnanswered: result.isUnanswered,
          stageId: result.stageId,
        })
      )
    } else if (record.results && record.results.stageResults) {
      // PVQC 多階段格式：合併所有階段的結果
      const allResults: AnalyzedQuestion[] = []
      record.results.stageResults.forEach((stage) => {
        stage.questionResults.forEach((result: DetailedQuestionResult) => {
          allResults.push({
            question: result.question,
            userAnswer: result.userAnswer,
            isCorrect: result.isCorrect,
            isUnanswered: result.isUnanswered,
            stageId: result.stageId,
          })
        })
      })
      return allResults
    } else {
      // 如果結果不存在或沒有問題結果，則使用舊格式
      console.log('使用舊格式歷史記錄，需要重新計算結果')
      return (
        record.questions?.map((question) => {
          // 獲取答案記錄
          const answerData = record.answers?.[question.id]

          let userAnswer: string | number | number[] | boolean | undefined

          if (answerData === undefined || answerData === null) {
            userAnswer = undefined
          } else if (
            typeof answerData === 'object' &&
            'answer' in answerData &&
            answerData.answer !== undefined
          ) {
            userAnswer = (answerData as AnswerRecord).answer
          } else if (
            typeof answerData === 'number' ||
            Array.isArray(answerData)
          ) {
            userAnswer = answerData
          } else {
            console.warn('未知的答案格式:', answerData)
            userAnswer = undefined
          }

          // 根據題型判斷是否正確
          let isCorrect = false

          switch (question.type) {
            case 'single_choice':
              isCorrect =
                typeof userAnswer === 'number' &&
                userAnswer === (question as SingleChoiceQuestion).correctIndex
              break

            case 'multiple_choice':
              if (Array.isArray(userAnswer)) {
                const correctIndexes = (question as MultipleChoiceQuestion)
                  .correctIndexes
                isCorrect =
                  userAnswer.length === correctIndexes.length &&
                  userAnswer.every((answer) => correctIndexes.includes(answer))
              }
              break

            case 'true_false':
              isCorrect =
                typeof userAnswer === 'boolean' &&
                userAnswer === (question as TrueFalseQuestion).correctAnswer
              break

            case 'vocabulary':
              // 單字題的評分邏輯
              if (typeof userAnswer === 'string') {
                isCorrect =
                  userAnswer.trim().toLowerCase() ===
                  (question as VocabularyQuestion).english.trim().toLowerCase()
              }
              break
          }

          return {
            question,
            userAnswer,
            isCorrect,
            isUnanswered: userAnswer === undefined,
            stageId: undefined, // 舊格式沒有階段信息
          }
        }) || []
      )
    }
  }, [record])

  /**
   * [function] playWord
   * 播放單字
   * @param {VocabularyQuestion} question - 單字題
   * @returns {void}
   */
  const playWord = (question: VocabularyQuestion): void => {
    if (question.english) {
      speakEnglish(question.english, {
        rate: 0.85,
      })
    }
  }

  /**
   * [function] questionGroups
   * 處理分組、篩選和排序
   * @returns {QuestionGroup[]} - 分組、篩選和排序後的題目資料
   */
  const questionGroups = useMemo<QuestionGroup[]>(() => {
    // 如果歷史記錄不存在，則返回空陣列
    if (!record) return []
    // 檢查是否為 PVQC 測驗
    const isPVQC = record.recordType === 'pvqc' && record.flowConfig

    // 如果為 PVQC 測驗且流程配置存在，則按階段分組
    if (isPVQC && record.flowConfig) {
      // 從 record.results.stageResults 索引出每階段的統計（含 passed）
      const stageStatsById = new Map<
        string,
        {
          correctCount: number
          totalCount: number
          passingScore?: number
          passed?: boolean
          label?: string
        }
      >()
      record.results?.stageResults?.forEach((sr) => {
        stageStatsById.set(sr.stageId, {
          correctCount: sr.correctCount,
          totalCount: sr.totalCount,
          passingScore: sr.passingScore,
          passed: sr.passed,
          label: sr.label,
        })
      })

      // PVQC 測驗：按階段分組
      return record.flowConfig.stages
        .map((stage, index) => {
          // 從 analyzedQuestions 中過濾出屬於此階段的題目
          const stageQuestions = analyzedQuestions.filter((analyzed) => {
            // 使用 analyzed.stageId（來自 DetailedQuestionResult）
            return analyzed.stageId === stage.stageId
          })

          // 如果只顯示錯誤題目，則過濾掉答對的題目
          let filteredQuestions = stageQuestions
          if (showWrongOnly) {
            filteredQuestions = filteredQuestions.filter((q) => !q.isCorrect)
          }

          // 如果按題號排序，則按題號排序
          if (sortByQuestionId) {
            filteredQuestions.sort((a, b) => {
              const aNum =
                parseInt(a.question.id.toString().replace(/\D/g, '')) || 0
              const bNum =
                parseInt(b.question.id.toString().replace(/\D/g, '')) || 0
              return aNum - bNum
            })
          }

          const stats = stageStatsById.get(stage.stageId)

          // 返回分組後的題目資料
          return {
            title: stats?.label || stage.label || getStageDisplayName(stage.mode, index),
            questions: filteredQuestions,
            stageId: stage.stageId,
            mode: stage.mode,
            correctCount: stats?.correctCount,
            totalCount: stats?.totalCount,
            passingScore: stats?.passingScore ?? stage.passingScore,
            passed: stats?.passed,
          }
        })
        .filter((group) => group.questions.length > 0) // 只顯示有題目的組
    } else {
      // Standard 測驗：按題型分組
      const groupedByType: Record<string, AnalyzedQuestion[]> = {}
      // 按題型分組
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

        // 如果分組不存在，則創建分組
        if (!groupedByType[typeName]) {
          groupedByType[typeName] = []
        }
        // 將題目加入分組
        groupedByType[typeName].push(analyzed)
      })

      // 返回分組後的題目資料
      return Object.entries(groupedByType)
        .map(([typeName, questions]) => {
          // 如果只顯示錯誤題目，則過濾掉答對的題目
          let filteredQuestions = questions
          if (showWrongOnly) {
            filteredQuestions = filteredQuestions.filter((q) => !q.isCorrect)
          }

          // 如果按題號排序，則按題號排序
          if (sortByQuestionId) {
            filteredQuestions.sort((a, b) => {
              const aNum =
                parseInt(a.question.id.toString().replace(/\D/g, '')) || 0
              const bNum =
                parseInt(b.question.id.toString().replace(/\D/g, '')) || 0
              return aNum - bNum
            })
          }

          // 返回分組後的題目資料
          return {
            title: typeName,
            questions: filteredQuestions,
          }
        })
        .filter((group) => group.questions.length > 0) // 只顯示有題目的組
    }
  }, [record, analyzedQuestions, showWrongOnly, sortByQuestionId])

  /**
   * [function] renderQuestionContent
   * 渲染題目內容
   * @param {AnalyzedQuestion} analyzed - 分析後的題目資料
   * @param {string} mode - 模式
   * @returns {JSX.Element} - 渲染題目內容
   */
  const renderQuestionContent = (
    analyzed: AnalyzedQuestion,
    mode?: string
  ): JSX.Element => {
    // 取得題目
    const { question } = analyzed

    // 根據題型渲染不同題目
    switch (question.type) {
      case 'single_choice':
      case 'multiple_choice':
        return renderChoiceQuestion(analyzed)

      case 'true_false':
        return renderTrueFalseQuestion(analyzed)

      case 'vocabulary':
        return renderVocabularyQuestion(analyzed, mode)

      default:
        return <div>未知題型</div>
    }
  }

  /**
   * [function] renderChoiceQuestion
   * 渲染選擇題（單選/多選）
   * @param {AnalyzedQuestion} analyzed - 分析後的題目資料
   * @returns {JSX.Element} - 渲染選擇題
   */
  const renderChoiceQuestion = (analyzed: AnalyzedQuestion): JSX.Element => {
    // 取得題目
    const { question, userAnswer, isCorrect, isUnanswered } = analyzed
    // 正確答案文字
    let correctAnswerText = ''
    // 取得選項
    let options: string[] = []

    if (question.type === 'single_choice') {
      // 如果題型為單選題，則設定選項和正確答案文字
      // 取得單選題
      const q = question as SingleChoiceQuestion
      // 設定選項
      options = q.options
      // 設定正確答案文字
      correctAnswerText = String.fromCharCode(65 + q.correctIndex)
    } else if (question.type === 'multiple_choice') {
      // 如果題型為多選題，則設定選項和正確答案文字
      // 取得多選題
      const q = question as MultipleChoiceQuestion
      // 設定選項
      options = q.options
      // 設定正確答案文字
      correctAnswerText = q.correctIndexes
        .map((idx) => String.fromCharCode(65 + idx))
        .join(', ')
    }

    // 返回渲染選擇題
    return (
      <div
        id={question.id}
        key={question.id}
        className={`question-item${' ' + question.type}${
          isCorrect ? ' correct' : ' wrong'
        }${isUnanswered ? ' unanswered' : ''}`}
      >
        <h3>#{question.id}</h3>
        <div className={`answer-status${isCorrect ? ' correct' : ' wrong'}`}>
          {isUnanswered ? (
            '未作答'
          ) : isCorrect ? (
            <p className="correct">
              <span className="material-symbols-rounded fill">check</span>
              答對
            </p>
          ) : (
            <>
              <p className="wrong">
                <span className="material-symbols-rounded fill">close</span>
                答錯
              </p>
              <p className="correct-answer">正確答案：{correctAnswerText}</p>
            </>
          )}
        </div>
        <p>
          {'question' in question
            ? (question as SingleChoiceQuestion | MultipleChoiceQuestion)
                .question
            : ''}
        </p>
        <div className="options">
          {options.map((option, idx) => {
            // 檢查是否為用戶選擇的答案
            const isUserAnswer = Array.isArray(userAnswer)
              ? userAnswer.includes(idx)
              : idx === userAnswer

            // 檢查是否為正確答案
            let isCorrectAnswer = false
            if (question.type === 'single_choice') {
              isCorrectAnswer =
                idx === (question as SingleChoiceQuestion).correctIndex
            } else if (question.type === 'multiple_choice') {
              isCorrectAnswer = (
                question as MultipleChoiceQuestion
              ).correctIndexes.includes(idx)
            }

            return (
              <div
                key={idx}
                className={`option${isUserAnswer ? ' user-answer' : ''}${
                  isCorrectAnswer ? ' correct-answer' : ''
                }`}
              >
                {String.fromCharCode(65 + idx)}. {option}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  /**
   * [function] renderTrueFalseQuestion
   * 渲染是非題
   * @param {AnalyzedQuestion} analyzed - 分析後的題目資料
   * @returns {JSX.Element} - 渲染是非題
   */
  const renderTrueFalseQuestion = (analyzed: AnalyzedQuestion): JSX.Element => {
    // 取得題目
    const { question, userAnswer, isCorrect, isUnanswered } = analyzed
    // 取得是非題
    const q = question as TrueFalseQuestion

    // 返回渲染是非題
    return (
      <div
        id={question.id}
        key={question.id}
        className={`question-item${isCorrect ? ' correct' : ' wrong'}${
          isUnanswered ? ' unanswered' : ''
        }`}
      >
        <h3>#{question.id}</h3>
        <div className={`answer-status ${isCorrect ? ' correct' : ' wrong'}`}>
          {isUnanswered ? (
            '未作答'
          ) : isCorrect ? (
            <p className="correct">
              <span className="material-symbols-rounded fill">check</span>
              答對
            </p>
          ) : (
            <>
              <p className="wrong">
                <span className="material-symbols-rounded fill">close</span>
                答錯
              </p>
              <p className="correct-answer">
                正確答案：{q.correctAnswer ? 'O' : 'X'}
              </p>
            </>
          )}
        </div>
        <p className="true-false-question">
          {q.correctAnswer ? (
            <span className="true-answer">O</span>
          ) : (
            <span className="false-answer">X</span>
          )}
          {q.question}
        </p>
        <div className="user-answer-display">
          <p className="answer-label">你的答案：</p>
          <p className="answer-value">
            {typeof userAnswer === 'boolean'
              ? userAnswer
                ? 'O'
                : 'X'
              : '未作答'}
          </p>
        </div>
      </div>
    )
  }

  /**
   * [function] renderVocabularyQuestion
   * 渲染單字題
   * @param {AnalyzedQuestion} analyzed - 分析後的題目資料
   * @param {string} mode - 模式
   * @returns {JSX.Element} - 渲染單字題
   */
  const renderVocabularyQuestion = (
    analyzed: AnalyzedQuestion,
    mode?: string
  ): JSX.Element => {
    // 取得題目
    const { question, userAnswer, isCorrect, isUnanswered } = analyzed
    // 取得單字題
    const q = question as VocabularyQuestion

    // 檢查是否為英文題
    const isEnglishQuestion =
      mode === 'pvqc_read' ||
      mode === 'pvqc_listen_chinese' ||
      mode === 'pvqc_listen_english'

    // 檢查是否為 PVQC 聽力英文題
    const isPvqcListenEnglishQuestion = mode === 'pvqc_listen_english'

    // 檢查是否為 PVQC 發音題
    const isPronunciationQuestion = mode === 'pvqc_pronunciation'

    // 取得正確答案文字
    const correctAnswerText = isEnglishQuestion
      ? isPvqcListenEnglishQuestion
        ? q.english
        : q.chinese
      : q.english

    return (
      <div
        id={question.id}
        key={question.id}
        className={`question-item${isCorrect ? ' correct' : ' rong'}${
          isUnanswered ? ' unanswered' : ''
        }`}
      >
        <h3>#{question.id}</h3>
        <div className={`answer-status${isCorrect ? ' correct' : ' wrong'}`}>
          {isUnanswered ? (
            '未作答'
          ) : isCorrect ? (
            <p className="correct">
              <span className="material-symbols-rounded fill">check</span>
              答對
            </p>
          ) : (
            <>
              <p className="wrong">
                <span className="material-symbols-rounded fill">close</span>
                答錯
              </p>
            </>
          )}
        </div>
        <div
          className="vocabulary-content"
          onClick={() => isEnglishQuestion && playWord(q)}
        >
          <div className="vocabulary-content-text">
            {isEnglishQuestion ? (
              <p className="question-text">{q.english}</p>
            ) : (
              <p className="question-text">{q.chinese}</p>
            )}
          </div>
          {isEnglishQuestion && (
            <span className="material-symbols-rounded">volume_up</span>
          )}
        </div>
        <div className="user-answer-display">
          <span className="answer-label">你的答案</span>
          <span className="answer-value">
            {typeof userAnswer === 'string'
              ? userAnswer
              : userAnswer?.toString() || '未作答'}
          </span>
        </div>
        {!isCorrect && (
          <div className="correct-answer-display">
            <p className="correct-answer">正確答案</p>

            {!isPronunciationQuestion && !isPvqcListenEnglishQuestion ? (
              <p className="correct-answer-text">{correctAnswerText}</p>
            ) : (
              <p
                className="correct-answer-text pronunciation-text"
                onClick={() => playWord(q)}
              >
                <span className="material-symbols-rounded">volume_up</span>
                {correctAnswerText}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  if (!id) {
    return (
      <div className="single-history">
        <div className="single-history-container">
          <div>找不到指定的歷史記錄</div>
        </div>
      </div>
    )
  }

  // 如果歷史記錄不存在，則顯示載入中
  if (!record) {
    return (
      <div className="single-history">
        <div className="single-history-container">
          <div>載入中...</div>
        </div>
      </div>
    )
  }

  // 渲染單一歷史記錄頁面
  return (
    <div className={`single-history ${pageAnimation ? 'page-animation' : ''}`}>
      <div className="single-history-container">
        <button className="close-btn" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <div className="single-history-header">
          <h2>{record.subject?.name || '未知測驗'}</h2>
          <p className="date-text">
            #
            {new Date(record.date)
              .toLocaleString('zh-TW', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
              .replace(/[/-]/g, '')
              .replace(/[\s:]/g, '')}
          </p>
          {(() => {
            const flowMode =
              record.flowMode ||
              (record.recordType === 'pvqc' ? 'pvqc_custom' : 'standard')
            const label =
              flowMode === 'pvqc_official'
                ? 'PVQC 官方模擬'
                : flowMode === 'pvqc_custom'
                ? '自訂 PVQC'
                : '標準測驗'
            return (
              <span className={`flow-mode-badge ${flowMode}`}>{label}</span>
            )
          })()}
        </div>

        {record.flowMode === 'pvqc_official' &&
          typeof record.results?.overallPassed === 'boolean' && (
            <div
              className={`official-banner ${
                record.results.overallPassed ? 'passed' : 'failed'
              }`}
            >
              <span className="material-symbols-rounded fill">
                {record.results.overallPassed ? 'verified' : 'cancel'}
              </span>
              <span className="banner-text">
                {record.results.overallPassed
                  ? 'PASS · 通過 PVQC 官方模擬'
                  : 'FAIL · 未通過 PVQC 官方模擬'}
              </span>
            </div>
          )}

        <div className="summary">
          <h1>
            {record.results?.overallCorrectRate || record.correctRate}{' '}
            <span>
              {record.results?.totalCorrect || record.correctCount}/
              {record.results?.questionResults?.length ||
                record.results?.stageResults?.reduce(
                  (sum, stage) => sum + stage.questionResults.length,
                  0
                ) ||
                record.questions?.length ||
                0}
            </span>
          </h1>
          <p>
            用時 {Math.floor(record.duration / 60000)} 分{' '}
            {Math.floor((record.duration % 60000) / 1000)} 秒
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

        <div className="questions-list">
          {questionGroups.map((group, groupIndex) => (
            <div
              key={`group-${groupIndex}`}
              className={`question-group ${group.mode}`}
            >
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
                {group.questions.map((analyzed) =>
                  renderQuestionContent(analyzed, group.mode)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SingleHistory
