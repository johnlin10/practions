import type { SubjectConfig } from '../types/quiz-flows'

// 題組：將同系列的題庫歸在一起（如 AIL 的單選、多選、是非）
// 題庫以 group 欄位指向這裡的 key，題組的資料只在這裡定義一次
export interface SubjectGroup {
  title: string // 題組名稱
  showTitle?: boolean // 題庫頁是否顯示標題，預設 true
}

export const subjectGroups = {
  ail_certification: {
    title: 'AIL',
    showTitle: false,
  },
  pvqc: {
    title: 'PVQC',
    showTitle: false,
  },
} satisfies Record<string, SubjectGroup>

export type SubjectGroupId = keyof typeof subjectGroups

export interface SubjectSection {
  group?: SubjectGroupId
  subjects: SubjectConfig[]
}

/**
 * [function] groupSubjects
 * 依 group 分組，同組的題庫歸在第一個成員的位置；沒有 group 的題庫各自一組
 */
export function groupSubjects(list: SubjectConfig[]): SubjectSection[] {
  const sections: SubjectSection[] = []
  for (const subject of list) {
    const section =
      subject.group && sections.find((s) => s.group === subject.group)
    if (section) section.subjects.push(subject)
    else sections.push({ group: subject.group, subjects: [subject] })
  }
  return sections
}
