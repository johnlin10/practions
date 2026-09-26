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
