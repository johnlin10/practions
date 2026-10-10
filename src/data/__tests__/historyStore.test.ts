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
const ail = subjects.ail_certification_exam.questions
const multi = ail.find((q) => q.type === 'multiple_choice')!
const trueFalse = ail.find((q) => q.type === 'true_false')!

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

  it('AIL 合併前的舊紀錄快照遺失時，依舊科目 ID 與題號找回合併後的題目', async () => {
    const record = newStandard('r1', [])
    record.subject = {
      id: 'ail_certification_exam_multiple_choice',
      name: 'AIL 證照檢定（多選）',
      baseQuestionType: 'multiple_choice',
    }
    record.results.questionResults = [
      {
        questionId: '5',
        snapshot: 'ail_certification_exam_multiple_choice/5#gone',
        userAnswer: [0],
        correctAnswer: [0],
        isCorrect: true,
        isUnanswered: false,
      } as never,
    ]
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify([record]))

    const [loaded] = (await loadStore()).getAllHistory()
    expect(loaded.results.questionResults![0].question).toEqual(
      ail.find((q) => q.id === '205'),
    )
  })

  it('清除紀錄時快照一起清空', async () => {
    const { addHistoryRecord, clearHistory } = await loadStore()
    addHistoryRecord(newStandard())
    clearHistory()
    expect(stored()).toEqual([])
    expect(storedSnapshots()).toEqual({})
    expect((await loadStore()).getAllHistory()).toEqual([])
  })

  it('刪除單筆紀錄：其他紀錄不變，只留下還有被引用的快照', async () => {
    const a = newStandard('20260925000000-aaaa')
    const b = newStandard('20260926000000-bbbb', accounting.slice(3, 5))
    const { addHistoryRecord, deleteHistoryRecord } = await loadStore()
    addHistoryRecord(a)
    addHistoryRecord(b)
    expect(Object.keys(storedSnapshots())).toHaveLength(4)
    deleteHistoryRecord(a.id)
    expect((await loadStore()).getAllHistory()).toEqual([b])
    expect(Object.keys(storedSnapshots())).toHaveLength(2)
  })
})

describe('匯出 / 匯入', () => {
  it('匯出後匯入到空的裝置，記錄與 localStorage 內容完全相同', async () => {
    localStorage.setItem(STORAGE_KEYS.QUIZ_HISTORY, JSON.stringify(oldRecords))
    const store = await loadStore()
    store.addHistoryRecord(newStandard())
    store.addHistoryRecord(newPvqc())
    const records = store.getAllHistory()
    const history = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)
    const backup = store.exportHistory()

    localStorage.clear()
    const fresh = await loadStore()
    // v1 沒有 id 無法去重，不匯入
    expect(fresh.importHistory(backup)).toBe(records.length)
    expect(fresh.getAllHistory()).toEqual(records)
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)!),
    ).toEqual(JSON.parse(history!).slice(1))
    expect((await loadStore()).getAllHistory()).toEqual(records)
  })

  it('依 id 合併：重複的略過，現有記錄保留', async () => {
    const store = await loadStore()
    store.addHistoryRecord(newStandard('r1'))
    const backup = store.exportHistory()
    store.clearHistory()
    store.addHistoryRecord(newStandard('r2'))

    expect(store.importHistory(backup)).toBe(1)
    expect(store.importHistory(backup)).toBe(0)
    expect(store.getAllHistory().map((r) => r.id)).toEqual(['r2', 'r1'])
  })

  it.each([
    ['非 JSON', 'not json'],
    ['別的檔案', JSON.stringify({ foo: 1 })],
    [
      '較新版本',
      JSON.stringify({ app: 'practions', version: 99, history: [] }),
    ],
  ])('%s：丟出錯誤且不動現有記錄', async (_, text) => {
    const store = await loadStore()
    store.addHistoryRecord(newStandard())
    const before = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)
    expect(() => store.importHistory(text)).toThrow()
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBe(before)
  })
})

describe('登入後的雲端模式', () => {
  // 模擬 Firestore：save 存進 Map，receive 模擬 onSnapshot 依日期送回全部紀錄
  // pause() 後的寫入要等 release() 才被確認（模擬離線），batches 記錄每批筆數
  const fakeCloud = (failSave = false) => {
    const docs = new Map<string, { date: string; data: string }>()
    const batches: number[] = []
    const held: (() => void)[] = []
    let paused = false
    return {
      docs,
      batches,
      pause: () => {
        paused = true
      },
      release: () => held.shift()?.(),
      sink: {
        save: async (entries: { id: string; date: string; data: string }[]) => {
          batches.push(entries.length)
          if (paused) await new Promise<void>((resolve) => held.push(resolve))
          if (failSave) throw new Error('permission-denied')
          entries.forEach(({ id, ...d }) => docs.set(id, d))
        },
        remove: async (ids: string[]) => {
          ids.forEach((id) => docs.delete(id))
        },
      },
      all: () =>
        [...docs.values()]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((d) => d.data),
    }
  }

  it('登入時本機紀錄併入雲端（重複 id 略過），確認寫入後刪除本機存檔', async () => {
    const a = newStandard('20260925000000-aaaa')
    const b = newStandard('20260926000000-bbbb', accounting.slice(3, 5))
    const local = await loadStore()
    local.addHistoryRecord(a)
    local.addHistoryRecord(b)

    // 另一台裝置已經上傳過 a
    const cloud = fakeCloud()
    const other = await loadStore()
    other.attachCloud(cloud.sink)
    other.receiveCloud([])
    other.addHistoryRecord(a)
    await Promise.resolve()

    const store = await loadStore()
    store.attachCloud(cloud.sink)
    store.receiveCloud(cloud.all())
    expect(await store.syncLocalToCloud()).toBe(1)
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.QUESTION_SNAPSHOTS)).toBeNull()

    // 換一台裝置登入：從雲端讀回，與交卷當下相同
    const fresh = await loadStore()
    fresh.attachCloud(cloud.sink)
    expect(fresh.getAllHistory()).toEqual([])
    fresh.receiveCloud(cloud.all())
    expect(fresh.getAllHistory()).toEqual([a, b])
  })

  it('雲端拒絕寫入時，同步保留本機存檔，新紀錄存回本機', async () => {
    const a = newStandard('20260925000000-aaaa')
    ;(await loadStore()).addHistoryRecord(a)
    const before = localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)

    const store = await loadStore()
    store.attachCloud(fakeCloud(true).sink)
    store.receiveCloud([])
    await expect(store.syncLocalToCloud()).rejects.toThrow()
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBe(before)

    const b = newStandard('20260926000000-bbbb', accounting.slice(3, 5))
    store.addHistoryRecord(b)
    await new Promise((resolve) => setTimeout(resolve))
    store.detachCloud()
    expect(store.getAllHistory()).toEqual([a, b])
  })

  const flush = () => new Promise((resolve) => setTimeout(resolve))

  it('登入中交卷先存本機：離線關閉 App 紀錄還在，雲端確認後才刪除本機備份', async () => {
    const a = newStandard('20260925000000-aaaa')
    const cloud = fakeCloud()
    cloud.pause()
    const store = await loadStore()
    store.attachCloud(cloud.sink)
    store.receiveCloud([])
    store.addHistoryRecord(a)

    // 還沒確認就關閉 App：重新開啟時從本機讀得到
    expect((await loadStore()).getAllHistory()).toEqual([a])

    cloud.release()
    await flush()
    expect(cloud.docs.has(a.id)).toBe(true)
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.QUESTION_SNAPSHOTS)).toBeNull()
  })

  it('登入中刪除尚未確認上傳的紀錄：雲端與本機備份都刪除，下次登入不會同步回來', async () => {
    const a = newStandard('20260925000000-aaaa')
    const b = newStandard('20260926000000-bbbb', accounting.slice(3, 5))
    const cloud = fakeCloud()
    const store = await loadStore()
    store.attachCloud(cloud.sink)
    store.receiveCloud([])
    store.addHistoryRecord(a)
    await flush()
    cloud.pause()
    store.addHistoryRecord(b)

    // b 還沒確認上傳就刪除（Firestore 會依序送出新增與刪除，這裡只看本機備份）
    store.deleteHistoryRecord(a.id)
    store.deleteHistoryRecord(b.id)
    await flush()
    expect(store.getAllHistory()).toEqual([])
    expect(cloud.docs.has(a.id)).toBe(false)
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBeNull()

    const next = await loadStore()
    next.attachCloud(cloud.sink)
    next.receiveCloud(cloud.all())
    expect(await next.syncLocalToCloud()).toBe(0)
    expect(next.getAllHistory()).toEqual([])
  })

  it('同步等待確認期間交卷，新紀錄的本機備份不會被同步刪除', async () => {
    const a = newStandard('20260925000000-aaaa')
    const b = newStandard('20260926000000-bbbb', accounting.slice(3, 5))
    ;(await loadStore()).addHistoryRecord(a)

    const cloud = fakeCloud()
    cloud.pause()
    const store = await loadStore()
    store.attachCloud(cloud.sink)
    store.receiveCloud([])
    const syncing = store.syncLocalToCloud()
    store.addHistoryRecord(b)

    // 同步先確認：只刪 a，b 還在等確認
    cloud.release()
    expect(await syncing).toBe(1)
    expect(stored()).toEqual([expect.objectContaining({ id: b.id })])

    cloud.release()
    await flush()
    expect(localStorage.getItem(STORAGE_KEYS.QUIZ_HISTORY)).toBeNull()
    expect([...cloud.docs.keys()]).toEqual([a.id, b.id])
  })

  it('登入中匯入時雲端拒絕寫入，紀錄保留在本機', async () => {
    const a = newStandard('20260925000000-aaaa')
    const guest = await loadStore()
    guest.addHistoryRecord(a)
    const backup = guest.exportHistory()
    localStorage.clear()

    const store = await loadStore()
    store.attachCloud(fakeCloud(true).sink)
    store.receiveCloud([])
    expect(store.importHistory(backup)).toBe(1)
    await flush()
    store.detachCloud()
    expect(store.getAllHistory()).toEqual([a])
  })

  it('大量紀錄依筆數與大小分批上傳', async () => {
    const store = await loadStore()
    const cloud = fakeCloud()
    store.attachCloud(cloud.sink)
    store.receiveCloud([])
    const backup = (history: unknown[]) =>
      JSON.stringify({ app: 'practions', version: 1, history, snapshots: {} })

    // 每批最多 100 筆
    store.importHistory(
      backup(Array.from({ length: 250 }, (_, i) => newStandard(`count-${i}`))),
    )
    expect(cloud.batches).toEqual([100, 100, 50])

    // 每批約 4 MiB：每筆約 1.5 MB，兩筆一批
    cloud.batches.length = 0
    const big = (id: string) => ({ ...newStandard(id), note: 'x'.repeat(5e5) })
    store.importHistory(backup([big('big-1'), big('big-2'), big('big-3')]))
    expect(cloud.batches).toEqual([2, 1])
    await flush()
    expect(cloud.docs.size).toBe(253)
  })
})

it('每個科目的題目 id 都不重複', () => {
  for (const subject of Object.values(subjects)) {
    const ids = subject.questions.map((q) => q.id)
    expect(new Set(ids).size, subject.id).toBe(ids.length)
  }
})
