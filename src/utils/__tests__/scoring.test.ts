import {
  standardScoringStrategy,
  pvqcWriteScoringStrategy,
  pvqcChineseScoringStrategy,
  pvqcEnglishScoringStrategy,
  pvqcPronunciationScoringStrategy,
  getScoringStrategy,
} from '../scoring'
import {
  SingleChoiceQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  VocabularyQuestion,
} from '../../types/questions'
import { AnswerRecord } from '../../types/answers'

const ans = (answer: AnswerRecord['answer']): AnswerRecord => ({
  questionId: 'q1',
  questionIndex: 0,
  answer,
  timestamp: new Date(0),
})

const single = (correctIndex: number): SingleChoiceQuestion => ({
  type: 'single_choice',
  id: 'q1',
  question: 'Q?',
  options: ['A', 'B', 'C', 'D'],
  correctIndex,
})

const multi = (correctIndexes: number[]): MultipleChoiceQuestion => ({
  type: 'multiple_choice',
  id: 'q1',
  question: 'Q?',
  options: ['A', 'B', 'C', 'D'],
  correctIndexes,
})

const tf = (correctAnswer: boolean): TrueFalseQuestion => ({
  type: 'true_false',
  id: 'q1',
  question: 'Q?',
  correctAnswer,
})

const vocab = (english: string, chinese: string): VocabularyQuestion => ({
  type: 'vocabulary',
  id: 'q1',
  english,
  chinese,
})

describe('standardScoringStrategy', () => {
  describe('single_choice', () => {
    it('正確選項 → true', () => {
      expect(standardScoringStrategy.evaluate(single(2), ans(2))).toBe(true)
    })
    it('錯誤選項 → false', () => {
      expect(standardScoringStrategy.evaluate(single(2), ans(1))).toBe(false)
    })
    it('非數字答案 → false', () => {
      expect(standardScoringStrategy.evaluate(single(2), ans('2'))).toBe(false)
    })
    it('陣列答案 → false', () => {
      expect(standardScoringStrategy.evaluate(single(2), ans([2]))).toBe(false)
    })
  })

  describe('multiple_choice', () => {
    it('完全相同 → true', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2]), ans([0, 2]))).toBe(true)
    })
    it('順序不同但內容相同 → true', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2, 3]), ans([3, 0, 2]))).toBe(true)
    })
    it('多選一個 → false', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2]), ans([0, 1, 2]))).toBe(false)
    })
    it('少選一個 → false', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2]), ans([0]))).toBe(false)
    })
    it('完全不同 → false', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2]), ans([1, 3]))).toBe(false)
    })
    it('非陣列答案 → false', () => {
      expect(standardScoringStrategy.evaluate(multi([0, 2]), ans(0))).toBe(false)
    })
    it('空陣列 vs 空正解 → true (length 0===0)', () => {
      expect(standardScoringStrategy.evaluate(multi([]), ans([]))).toBe(true)
    })
  })

  describe('true_false', () => {
    it('正確 → true', () => {
      expect(standardScoringStrategy.evaluate(tf(true), ans(true))).toBe(true)
      expect(standardScoringStrategy.evaluate(tf(false), ans(false))).toBe(true)
    })
    it('錯誤 → false', () => {
      expect(standardScoringStrategy.evaluate(tf(true), ans(false))).toBe(false)
    })
    it('非布林答案 → false', () => {
      expect(standardScoringStrategy.evaluate(tf(true), ans('true'))).toBe(false)
      expect(standardScoringStrategy.evaluate(tf(true), ans(1))).toBe(false)
    })
  })

  it('傳入 vocabulary 題型 → false（standard 不支援）', () => {
    expect(standardScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('apple'))).toBe(false)
  })
})

describe('pvqcWriteScoringStrategy（看中拼英）', () => {
  it('完全相符 → true', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('apple'))).toBe(true)
  })
  it('大小寫不敏感', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('Apple', '蘋果'), ans('APPLE'))).toBe(true)
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('Apple'))).toBe(true)
  })
  it('前後空白不敏感', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('  apple  '))).toBe(true)
  })
  it('拼錯 → false', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('aple'))).toBe(false)
  })
  it('空字串 → false', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans(''))).toBe(false)
  })
  it('全空白字串 → false', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('   '))).toBe(false)
  })
  it('非字串答案 → false', () => {
    expect(pvqcWriteScoringStrategy.evaluate(vocab('apple', '蘋果'), ans(0))).toBe(false)
  })
  it('非 vocabulary 題型 → false', () => {
    expect(pvqcWriteScoringStrategy.evaluate(single(0), ans('apple'))).toBe(false)
  })
})

describe('pvqcChineseScoringStrategy（中文比對）', () => {
  it('完全相符 → true', () => {
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('蘋果'))).toBe(true)
  })
  it('前後空白不敏感（修復後的行為）', () => {
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('  蘋果  '))).toBe(true)
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', ' 蘋果'), ans('蘋果'))).toBe(true)
  })
  it('內容不同 → false', () => {
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('香蕉'))).toBe(false)
  })
  it('空字串 → false', () => {
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', '蘋果'), ans(''))).toBe(false)
  })
  it('非字串答案 → false', () => {
    expect(pvqcChineseScoringStrategy.evaluate(vocab('apple', '蘋果'), ans(0))).toBe(false)
  })
})

describe('pvqcEnglishScoringStrategy（聽英選英）', () => {
  it('完全相符 → true', () => {
    expect(pvqcEnglishScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('apple'))).toBe(true)
  })
  it('大小寫 + 空白不敏感', () => {
    expect(pvqcEnglishScoringStrategy.evaluate(vocab('Apple', '蘋果'), ans('  APPLE '))).toBe(true)
  })
  it('內容不同 → false', () => {
    expect(pvqcEnglishScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('banana'))).toBe(false)
  })
})

describe('pvqcPronunciationScoringStrategy（發音題）', () => {
  it('完全相符 → true', () => {
    expect(pvqcPronunciationScoringStrategy.evaluate(vocab('apple', '蘋果'), ans('apple'))).toBe(true)
  })
  it('大小寫 + 空白不敏感', () => {
    expect(pvqcPronunciationScoringStrategy.evaluate(vocab('apple', '蘋果'), ans(' Apple '))).toBe(true)
  })
})

describe('getScoringStrategy', () => {
  it('pvqc_write → pvqcWriteScoringStrategy', () => {
    expect(getScoringStrategy('pvqc_write')).toBe(pvqcWriteScoringStrategy)
  })
  it('pvqc_read / pvqc_listen_chinese → pvqcChineseScoringStrategy', () => {
    expect(getScoringStrategy('pvqc_read')).toBe(pvqcChineseScoringStrategy)
    expect(getScoringStrategy('pvqc_listen_chinese')).toBe(pvqcChineseScoringStrategy)
  })
  it('pvqc_listen_english → pvqcEnglishScoringStrategy', () => {
    expect(getScoringStrategy('pvqc_listen_english')).toBe(pvqcEnglishScoringStrategy)
  })
  it('pvqc_pronunciation / pvqc_read_listen → pvqcPronunciationScoringStrategy', () => {
    expect(getScoringStrategy('pvqc_pronunciation')).toBe(pvqcPronunciationScoringStrategy)
    expect(getScoringStrategy('pvqc_read_listen')).toBe(pvqcPronunciationScoringStrategy)
  })
  it('standard → standardScoringStrategy', () => {
    expect(getScoringStrategy('standard')).toBe(standardScoringStrategy)
  })
})
