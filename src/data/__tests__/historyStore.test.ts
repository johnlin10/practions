/**
 * historyStore 瘦身儲存的相容性測試
 *
 * 保證：
 * 1. 既有各版本舊記錄（含各題型、無 id 的 v1 記錄）讀取結果不變、寫回 localStorage 時位元組不變
 * 2. 新記錄題目存成去重快照，重新載入後與交卷當下相同；題庫修改後新舊記錄各自顯示當時版本
 * 3. 題庫每個科目的題目 id 不重複（補題依 id 查找的前提）
 */
import { STORAGE_KEYS } from '@/types'
import type { HistoryRecord } from '@/types'
import { subjects } from '@/data/subjects'
import type { Question, VocabularyQuestion } from '@/types/questions'

const loadStore = async () => {
  vi.resetModules()
  return import('@/data/historyStore')
}

const stored = (): unknown[] =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY) ?? '[]')
const storedSnapshots = (): Record<string, unknown> =>
  JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTION_SNAPSHOTS) ?? '{}')

const accounting = subjects.accounting.questions
const vocab = subjects.pvqc_ai.questions as VocabularyQuestion[]
const multi = subjects.ail_certification_exam_multiple_choice.questions[0]
const trueFalse = subjects.ail_certification_exam_true_false.questions[0]

// 舊記錄存的題目與目前題庫不同（模擬題庫改過），用來證明舊記錄顯示的是自己存的版本
const oldCopy = { ...accounting[0], question: '舊版題目文字' }
const oldMulti = { ...multi, question: '舊版多選題' }
const oldTrueFalse = { ...trueFalse, question: '舊版是非題' }

// v1（2025-04 以前）：沒有 id，目前本來就無法顯示；只要求 localStorage 不刪掉它
const v1 = {
  subject: { id: 'accounting', name: '會計學（一）' },
  date: '2024-12-01T00:00:00.000Z',
  duration: 1000,
  correctRate: '100.00',
  correctCount: 1,
  answers: { [oldCopy.id]: 1 },
  questions: [oldCopy],
}

// 格式 A：最早期，只有 questions + answers，沒有 results
const legacy = {
  id: '20240101000000',
  subject: { id: 'accounting', name: '會計學（一）' },
  date: '2024-01-01T00:00:00.000Z',
  questions: [oldCopy],
  answers: { [oldCopy.id]: { questionId: oldCopy.id, answer: 1 } },
  correctRate: '100.00',
  correctCount: 1,
}

// 格式 B：標準測驗，results.questionResults 帶題目全文
const standard = {
  id: '20250101000000',
  subject: {
    id: 'accounting',
    name: '會計學（一）',
    baseQuestionType: 'single_choice',
  },
  recordType: 'standard',
  date: '2025-01-01T00:00:00.000Z',
  duration: 1000,
  results: {
    totalCorrect: 2,
    totalQuestions: 3,
    overallCorrectRate: '66.67',
    questionResults: [
      {
        questionId: oldCopy.id,
        question: oldCopy,
        userAnswer: 1,
        correctAnswer: 1,
        isCorrect: true,
        isUnanswered: false,
      },
      {
        questionId: oldMulti.id,
        question: oldMulti,
        userAnswer: [0, 2],
        correctAnswer: [0, 1],
        isCorrect: false,
        isUnanswered: false,
      },
      {
        questionId: oldTrueFalse.id,
        question: oldTrueFalse,
        userAnswer: true,
        correctAnswer: true,
        isCorrect: true,
        isUnanswered: false,
      },
    ],
  },
  questions: [oldCopy, oldMulti, oldTrueFalse],
  answers: {},
}

// 格式 C：PVQC 官方模擬，多階段 stageResults 帶題目全文與及格判定
const pvqcResult = (
  stageId: string,
  q: VocabularyQuestion,
  isCorrect: boolean,
) => ({
  questionId: q.id,
  question: { ...q, chinese: '舊中文' },
  userAnswer: isCorrect ? q.english : '錯的',
  correctAnswer: q.english,
  isCorrect,
  isUnanswered: false,
  stageId,
})
const pvqc = {
  id: '20250601000000',
  subject: { id: 'pvqc_ai', name: 'PVQC AI', baseQuestionType: 'vocabulary' },
  recordType: 'pvqc',
  flowMode: 'pvqc_official',
  flowConfig: {
    id: 'pvqc_official',
    name: 'PVQC',
    stages: [
      {
        stageId: 's1',
        mode: 'pvqc_write',
        questionCount: 1,
        passingScore: 1,
        label: '測驗一：寫',
      },
      {
        stageId: 's2',
        mode: 'pvqc_listen_english',
        questionCount: 1,
        passingScore: 1,
        label: '測驗四：聽',
      },
    ],
  },
  date: '2025-06-01T00:00:00.000Z',
  duration: 1000,
  results: {
    totalCorrect: 1,
    totalQuestions: 2,
    overallCorrectRate: '50.00',
    overallPassed: false,
    stageResults: [
      {
        stageId: 's1',
        mode: 'pvqc_write',
        correctCount: 1,
        totalCount: 1,
        correctRate: '100.00',
        passingScore: 1,
        passed: true,
        label: '測驗一：寫',
        questionResults: [pvqcResult('s1', vocab[0], true)],
      },
      {
        stageId: 's2',
        mode: 'pvqc_listen_english',
        correctCount: 0,
        totalCount: 1,
        correctRate: '0.00',
        passingScore: 1,
        passed: false,
        label: '測驗四：聽',
        questionResults: [pvqcResult('s2', vocab[1], false)],
      },
    ],
  },
}

const oldRecords = [v1, legacy, standard, pvqc]
const displayable = [legacy, standard, pvqc]
const withDate = (r: { date: string }) => ({ ...r, date: new Date(r.date) })

// 新記錄：預設用目前題庫的題目建立
const newStandard = (
  id = '20260925000000',
  questions: Question[] = accounting.slice(1, 3),
): HistoryRecord => ({
  id,
  subject: {
    id: 'accounting',
    name: '會計學（一）',
    baseQuestionType: 'single_choice',
  },
  recordType: 'standard',
  flowMode: 'standard',
  date: new Date('2026-09-25T00:00:00.000Z'),
  duration: 1000,
  correctRate: '50.00',
  correctCount: 1,
  results: {
    totalCorrect: 1,
    totalQuestions: 2,
    overallCorrectRate: '50.00',
    questionResults: questions.map((q, i) => ({
      questionId: q.id,
      question: q,
      userAnswer: 0,
      correctAnswer: 1,
      isCorrect: i === 0,
      isUnanswered: false,
    })),
  },
})

const newPvqc = (): HistoryRecord => ({
  ...(withDate(pvqc) as unknown as HistoryRecord),
  id: '20260925000001',
  results: {
    ...(pvqc.results as HistoryRecord['results']),
    stageResults: pvqc.results.stageResults.map((s) => ({
      ...s,
      questionResults: s.questionResults.map((r) => ({
        ...r,
        question: vocab.find((q) => q.id === r.questionId)!,
      })),
    })),
  },
})

beforeEach(() => {
  localStorage.clear()
})

describe('舊記錄相容', () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(oldRecords))
  })

  it('各格式、各題型讀出來與原資料相同（題目用記錄自己存的版本）', async () => {
    const { getAllHistory } = await loadStore()
    expect(getAllHistory()).toEqual(displayable.map(withDate))
  })

  it('新增記錄後，舊記錄在 localStorage 的內容位元組不變', async () => {
    const { addHistoryRecord } = await loadStore()
    addHistoryRecord(newStandard())
    const after = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)!)
    expect(JSON.stringify(after.slice(0, 4))).toBe(JSON.stringify(oldRecords))
  })

  it('結構異常導致補題失敗時，照原樣顯示', async () => {
    const broken = {
      ...standard,
      id: 'broken',
      results: { questionResults: [null] },
    }
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify([broken]))
    const { getAllHistory } = await loadStore()
    expect(getAllHistory()).toEqual([withDate(broken)])
  })
})

describe('新記錄：題目快照', () => {
  it.each([
    ['標準測驗', () => newStandard()],
    ['PVQC 多階段', newPvqc],
  ])('%s：記錄不存題目全文，重新載入後與交卷當下相同', async (_, make) => {
    const original = make()
    ;(await loadStore()).addHistoryRecord(original)

    expect(JSON.stringify(stored())).not.toContain('"question":{')
    expect(Object.keys(storedSnapshots())).toHaveLength(2)

    const { getAllHistory } = await loadStore()
    expect(getAllHistory()).toEqual([original])
  })

  it('同一題同一版本只存一份快照', async () => {
    const [q1, q2, q3] = accounting.slice(1, 4)
    const { addHistoryRecord } = await loadStore()
    addHistoryRecord(newStandard('r1', [q1, q2]))
    addHistoryRecord(newStandard('r2', [q2, q3]))
    expect(Object.keys(storedSnapshots())).toHaveLength(3)
  })

  it('題庫修改後，舊記錄顯示舊版、新記錄顯示新版', async () => {
    const q = accounting[1]
    const edited = { ...q, question: '修改後的題目', correctIndex: 0 }
    const { addHistoryRecord } = await loadStore()
    addHistoryRecord(newStandard('r1', [q]))
    addHistoryRecord(newStandard('r2', [edited]))
    expect(Object.keys(storedSnapshots())).toHaveLength(2)

    const [r1, r2] = (await loadStore()).getAllHistory()
    expect(r1.results.questionResults![0].question).toEqual(q)
    expect(r2.results.questionResults![0].question).toEqual(edited)
  })

  it('快照遺失時改用目前題庫，題庫也沒有就略過，分數維持記錄內的統計', async () => {
    const kept = accounting[1]
    const deleted = { ...accounting[2], id: 'deleted-id' }
    ;(await loadStore()).addHistoryRecord(newStandard('r1', [kept, deleted]))
    localStorage.removeItem(STORAGE_KEYS.QUESTION_SNAPSHOTS)

    const [loaded] = (await loadStore()).getAllHistory()
    expect(loaded.results.questionResults!.map((r) => r.question)).toEqual([
      kept,
    ])
    expect(loaded.results.totalCorrect).toBe(1)
    expect(loaded.results.totalQuestions).toBe(2)
  })

  it('清除紀錄時快照一起清空', async () => {
    const { addHistoryRecord, clearHistory } = await loadStore()
    addHistoryRecord(newStandard())
    clearHistory()
    expect(stored()).toEqual([])
    expect(storedSnapshots()).toEqual({})
    expect((await loadStore()).getAllHistory()).toEqual([])
  })
})

it('每個科目的題目 id 都不重複', () => {
  for (const subject of Object.values(subjects)) {
    const ids = subject.questions.map((q) => q.id)
    expect(new Set(ids).size, subject.id).toBe(ids.length)
  }
})
