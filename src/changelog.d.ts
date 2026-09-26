// 由 vite.config.ts 的 readChangelog 於建置時注入
interface ChangelogEntry {
  hash: string
  date: string // YYYY-MM-DD
  version: string // 如 v2.5.1、v2.0.0 Beta 2
  title: string
  body: string
}

declare const __CHANGELOG__: ChangelogEntry[]
