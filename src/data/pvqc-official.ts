/**
 * PVQC 官方測驗規範
 *
 * 依 PVQC（Practical Vocabulary Quick Certificate）官方規範：
 * - 測驗一｜寫（選考，通過者證書額外註明 Spelling）：20 分鐘 / 100 題 / 及格 40
 * - 測驗二｜讀                                   ：10 分鐘 / 100 題 / 及格 70
 * - 測驗三｜聽（聽英選中）                       ：10 分鐘 / 100 題 / 及格 70
 * - 測驗四｜聽（聽英選英）                       ：10 分鐘 / 100 題 / 及格 70
 * - 測驗五｜聽（看中選發音）                     ：10 分鐘 / 100 題 / 及格 70
 * - 測驗六｜讀聽（看英聽選發音）                 ：10 分鐘 / 100 題 / 及格 70
 *
 * 所有測驗按順序連著考，每段限時，時間到強制進入下一段。
 */

import { QuizFlowConfig, QuizStageConfig } from '../types/quiz-flows'

// 每階段官方題數
export const OFFICIAL_PVQC_QUESTION_COUNT = 100

// 測驗一（Spelling 選考）
const OFFICIAL_STAGE_WRITE: QuizStageConfig = {
  stageId: 'pvqc_official_write',
  mode: 'pvqc_write',
  questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
  timeLimit: 20,
  passingScore: 40,
  label: '測驗一：寫（看中拼英）',
}

// 測驗二到六（必考）
const OFFICIAL_STAGES_MANDATORY: QuizStageConfig[] = [
  {
    stageId: 'pvqc_official_read',
    mode: 'pvqc_read',
    questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
    timeLimit: 10,
    passingScore: 70,
    label: '測驗二：讀（看英選中）',
  },
  {
    stageId: 'pvqc_official_listen_chinese',
    mode: 'pvqc_listen_chinese',
    questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
    timeLimit: 10,
    passingScore: 70,
    label: '測驗三：聽（聽英選中）',
  },
  {
    stageId: 'pvqc_official_listen_english',
    mode: 'pvqc_listen_english',
    questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
    timeLimit: 10,
    passingScore: 70,
    label: '測驗四：聽（聽英選英）',
  },
  {
    stageId: 'pvqc_official_pronunciation',
    mode: 'pvqc_pronunciation',
    questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
    timeLimit: 10,
    passingScore: 70,
    label: '測驗五：聽（看中選發音）',
  },
  {
    stageId: 'pvqc_official_read_listen',
    mode: 'pvqc_read_listen',
    questionCount: OFFICIAL_PVQC_QUESTION_COUNT,
    timeLimit: 10,
    passingScore: 70,
    label: '測驗六：讀聽（看英聽選發音）',
  },
]

// 完整 6 階段（含 Spelling 選考）
export const OFFICIAL_PVQC_STAGES_FULL: QuizStageConfig[] = [
  OFFICIAL_STAGE_WRITE,
  ...OFFICIAL_STAGES_MANDATORY,
]

// 不含 Spelling 的 5 階段（必考）
export const OFFICIAL_PVQC_STAGES_WITHOUT_SPELLING: QuizStageConfig[] =
  OFFICIAL_STAGES_MANDATORY

/**
 * 建立官方模擬流程配置
 * @param includeSpelling 是否包含 Spelling 選考（測驗一）
 */
export function buildOfficialFlow(includeSpelling: boolean): QuizFlowConfig {
  const stages = includeSpelling
    ? OFFICIAL_PVQC_STAGES_FULL
    : OFFICIAL_PVQC_STAGES_WITHOUT_SPELLING

  const totalTimeLimit = stages.reduce((sum, s) => sum + s.timeLimit, 0)

  return {
    id: includeSpelling ? 'pvqc_official_with_spelling' : 'pvqc_official_no_spelling',
    name: includeSpelling
      ? 'PVQC 官方模擬（含 Spelling 選考）'
      : 'PVQC 官方模擬',
    type: 'multi_stage',
    stages,
    totalTimeLimit,
    flowMode: 'pvqc_official',
    enforceStageTimer: true,
  }
}
