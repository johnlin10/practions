import {
  generateDetailedResults,
  determineQuizRecordType,
  generateFlowConfigSummary,
} from '../detailed-results'
import { answerKey } from '../answer-key'
import { QuizState, AnswersCollection } from '../../types/answers'
import { Question, VocabularyQuestion } from '../../types/questions'
import { QuizFlowConfig } from '../../types/quiz-flows'

const vocab = (id: string, english: string, chinese: string): VocabularyQuestion => ({
  type: 'vocabulary',
  id,
  english,
  chinese,
})

const mkAnswers = (entries: Array<[string, string]>): AnswersCollection => {
  const result: AnswersCollection = {}
  entries.forEach(([qid, ans], idx) => {
    result[qid] = {
      questionId: qid,
      questionIndex: idx,
      answer: ans,
      timestamp: new Date(0),
    }
  })
  return result
}

const mkPVQCState = (
  stagesQuestions: Record<string, Question[]>,
  answers: AnswersCollection,
  stageModes: Array<{ stageId: string; mode: string; passingScore?: number; label?: string }>,
  flowMode?: 'pvqc_custom' | 'pvqc_official'
): QuizState => {
  const flowConfig: QuizFlowConfig = {
    id: 'test',
    name: 'Test',
    type: 'multi_stage',
    flowMode,
    stages: stageModes.map(({ stageId, mode, passingScore, label }) => ({
      stageId,
      mode: mode as any,
      questionCount: stagesQuestions[stageId]?.length ?? 0,
      timeLimit: 10,
      passingScore,
      label,
    })),
    totalTimeLimit: 10 * stageModes.length,
  }
  return {
    subjectId: 's',
    subjectName: 'S',
    baseQuestionType: 'vocabulary',
    flowConfig,
    currentStageIndex: 0,
    currentStage: flowConfig.stages[0],
    allStagesQuestions: stagesQuestions,
    currentQuestions: stagesQuestions[stageModes[0].stageId] ?? [],
    answers,
    currentQuestionIndex: 0,
    startTime: null,
    endTime: null,
    stageStartTime: null,
  }
}

describe('generateDetailedResults — PVQC 多階段', () => {
  it('每階段獨立計算 correctCount / totalCount / correctRate', () => {
    const stage1Qs = [vocab('w1', 'apple', '蘋果'), vocab('w2', 'banana', '香蕉')]
    const stage2Qs = [vocab('r1', 'cat', '貓'), vocab('r2', 'dog', '狗')]
    const answers = mkAnswers([
      ['w1', 'apple'], // 對
      ['w2', 'wrong'], // 錯
      ['r1', '貓'], // 對
      // r2 未作答
    ])
    const state = mkPVQCState(
      { stage1: stage1Qs, stage2: stage2Qs },
      answers,
      [
        { stageId: 'stage1', mode: 'pvqc_write' },
        { stageId: 'stage2', mode: 'pvqc_read' },
      ]
    )

    const result = generateDetailedResults(state)

    expect(result.stageResults).toHaveLength(2)
    expect(result.stageResults![0]).toMatchObject({
      stageId: 'stage1',
      correctCount: 1,
      totalCount: 2,
      correctRate: '50%',
    })
    expect(result.stageResults![1]).toMatchObject({
      stageId: 'stage2',
      correctCount: 1,
      totalCount: 2,
      correctRate: '50%',
    })
    expect(result.totalCorrect).toBe(2)
    expect(result.totalQuestions).toBe(4)
    expect(result.overallCorrectRate).toBe('50%')
  })

  it('未作答題目標記 isUnanswered=true 且計為錯誤', () => {
    const qs = [vocab('w1', 'apple', '蘋果'), vocab('w2', 'banana', '香蕉')]
    const answers = mkAnswers([['w1', 'apple']])
    const state = mkPVQCState({ s: qs }, answers, [
      { stageId: 's', mode: 'pvqc_write' },
    ])
    const result = generateDetailedResults(state)
    const stage = result.stageResults![0]
    expect(stage.questionResults[0].isUnanswered).toBe(false)
    expect(stage.questionResults[0].isCorrect).toBe(true)
    expect(stage.questionResults[1].isUnanswered).toBe(true)
    expect(stage.questionResults[1].isCorrect).toBe(false)
  })

  it('中文題答案前後空白不影響判定（修復後）', () => {
    const qs = [vocab('r1', 'apple', '蘋果')]
    const answers = mkAnswers([['r1', '  蘋果  ']])
    const state = mkPVQCState({ s: qs }, answers, [
      { stageId: 's', mode: 'pvqc_read' },
    ])
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].correctCount).toBe(1)
  })

  it('沒有作答任何題 → correctCount 為 0、correctRate 0%', () => {
    const qs = [vocab('w1', 'apple', '蘋果'), vocab('w2', 'banana', '香蕉')]
    const state = mkPVQCState({ s: qs }, {}, [
      { stageId: 's', mode: 'pvqc_write' },
    ])
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].correctCount).toBe(0)
    expect(result.stageResults![0].correctRate).toBe('0%')
  })

  it('同 questionId 跨階段重複時，答案不會互相污染（compound key 隔離）', () => {
    // 同一題庫的單字題 q1 同時出現在 stage1 (pvqc_write) 與 stage2 (pvqc_read)
    const q1 = vocab('q1', 'apple', '蘋果')
    const stage1Qs = [q1]
    const stage2Qs = [q1]

    // stage1 用 compound key 存「正確的英文」；stage2 用 compound key 存「錯的中文」
    const answers: AnswersCollection = {
      [answerKey('stage1', 'q1')]: {
        questionId: 'q1',
        questionIndex: 0,
        answer: 'apple',
        timestamp: new Date(0),
        stageId: 'stage1',
      },
      [answerKey('stage2', 'q1')]: {
        questionId: 'q1',
        questionIndex: 0,
        answer: '錯誤的中文',
        timestamp: new Date(0),
        stageId: 'stage2',
      },
    }

    const state = mkPVQCState(
      { stage1: stage1Qs, stage2: stage2Qs },
      answers,
      [
        { stageId: 'stage1', mode: 'pvqc_write' },
        { stageId: 'stage2', mode: 'pvqc_read' },
      ]
    )

    const result = generateDetailedResults(state)
    expect(result.stageResults![0].questionResults[0].userAnswer).toBe('apple')
    expect(result.stageResults![0].correctCount).toBe(1)
    expect(result.stageResults![1].questionResults[0].userAnswer).toBe(
      '錯誤的中文'
    )
    expect(result.stageResults![1].correctCount).toBe(0)
  })

  it('totalCount 為 0 時 correctRate 顯示 0% 不噴 NaN', () => {
    const state = mkPVQCState({ s: [] }, {}, [
      { stageId: 's', mode: 'pvqc_write' },
    ])
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].correctRate).toBe('0%')
    expect(result.overallCorrectRate).toBe('0%')
  })
})

describe('分階段及格判定', () => {
  const mkVocab10 = (prefix: string) =>
    Array.from({ length: 10 }, (_, i) => vocab(`${prefix}${i}`, `eng${i}`, `中${i}`))

  it('passingScore 存在且達標 → passed=true', () => {
    const qs = mkVocab10('w')
    const answers = mkAnswers(qs.slice(0, 7).map((q): [string, string] => [q.id, q.english]))
    const state = mkPVQCState(
      { s: qs },
      answers,
      [{ stageId: 's', mode: 'pvqc_write', passingScore: 7, label: '測驗一' }],
      'pvqc_official'
    )
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].passed).toBe(true)
    expect(result.stageResults![0].passingScore).toBe(7)
    expect(result.stageResults![0].label).toBe('測驗一')
  })

  it('passingScore 存在但未達標 → passed=false', () => {
    const qs = mkVocab10('w')
    const answers = mkAnswers(qs.slice(0, 3).map((q): [string, string] => [q.id, q.english]))
    const state = mkPVQCState(
      { s: qs },
      answers,
      [{ stageId: 's', mode: 'pvqc_write', passingScore: 7 }],
      'pvqc_official'
    )
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].passed).toBe(false)
  })

  it('passingScore 不存在 → passed=undefined（自訂模式）', () => {
    const qs = mkVocab10('w')
    const answers = mkAnswers(qs.map((q): [string, string] => [q.id, q.english]))
    const state = mkPVQCState({ s: qs }, answers, [{ stageId: 's', mode: 'pvqc_write' }])
    const result = generateDetailedResults(state)
    expect(result.stageResults![0].passed).toBeUndefined()
  })

  it('pvqc_official 全階段通過 → overallPassed=true', () => {
    const s1 = mkVocab10('a')
    const s2 = mkVocab10('b')
    const answers = mkAnswers([
      ...s1.map((q): [string, string] => [q.id, q.english]), // pvqc_write 比對 english
      ...s2.map((q): [string, string] => [q.id, q.chinese]), // pvqc_read 比對 chinese
    ])
    const state = mkPVQCState(
      { s1, s2 },
      answers,
      [
        { stageId: 's1', mode: 'pvqc_write', passingScore: 7 },
        { stageId: 's2', mode: 'pvqc_read', passingScore: 7 },
      ],
      'pvqc_official'
    )
    const result = generateDetailedResults(state)
    expect(result.overallPassed).toBe(true)
  })

  it('pvqc_official 一階段未通過 → overallPassed=false', () => {
    const s1 = mkVocab10('a')
    const s2 = mkVocab10('b')
    const answers = mkAnswers([
      ...s1.map((q): [string, string] => [q.id, q.english]),
      // s2 都不對：用中文當英文答案
      ...s2.map((q): [string, string] => [q.id, q.chinese]),
    ])
    const state = mkPVQCState(
      { s1, s2 },
      answers,
      [
        { stageId: 's1', mode: 'pvqc_write', passingScore: 7 },
        { stageId: 's2', mode: 'pvqc_write', passingScore: 7 },
      ],
      'pvqc_official'
    )
    const result = generateDetailedResults(state)
    expect(result.overallPassed).toBe(false)
  })

  it('pvqc_custom 模式不計算 overallPassed', () => {
    const qs = mkVocab10('w')
    const answers = mkAnswers(qs.map((q): [string, string] => [q.id, q.english]))
    const state = mkPVQCState(
      { s: qs },
      answers,
      [{ stageId: 's', mode: 'pvqc_write', passingScore: 7 }],
      'pvqc_custom'
    )
    const result = generateDetailedResults(state)
    expect(result.overallPassed).toBeUndefined()
  })
})

describe('determineQuizRecordType', () => {
  it('包含任一 pvqc_ 階段 → pvqc', () => {
    expect(
      determineQuizRecordType({ stages: [{ mode: 'pvqc_write' }] })
    ).toBe('pvqc')
    expect(
      determineQuizRecordType({
        stages: [{ mode: 'standard' }, { mode: 'pvqc_read' }],
      })
    ).toBe('pvqc')
  })
  it('全部為 standard → standard', () => {
    expect(determineQuizRecordType({ stages: [{ mode: 'standard' }] })).toBe(
      'standard'
    )
  })
})

describe('generateFlowConfigSummary', () => {
  it('flowConfig 為空 / 階段為 0 → undefined', () => {
    expect(generateFlowConfigSummary(null)).toBeUndefined()
    expect(generateFlowConfigSummary({ stages: [] })).toBeUndefined()
  })
  it('回傳精簡的 stages 結構', () => {
    const summary = generateFlowConfigSummary({
      id: 'x',
      name: 'X',
      stages: [{ stageId: 's1', mode: 'pvqc_write', questionCount: 100, timeLimit: 20 }],
    })
    expect(summary).toEqual({
      id: 'x',
      name: 'X',
      stages: [{ stageId: 's1', mode: 'pvqc_write', questionCount: 100 }],
    })
  })
})
