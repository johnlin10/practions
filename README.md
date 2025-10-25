# Practions

**Practice Questions** - 中臺科技大學資管系專用測驗系統

一個功能完整的線上測驗平台，提供多種題型測驗、PVQC 多階段測驗、題庫管理及歷史記錄查詢功能。採用 React 18 + TypeScript 開發，具備完整的型別安全保障和現代化的使用者體驗。

## 核心功能

### 🎯 測驗系統

- **標準測驗模式**
  - [x] 單選題測驗
  - [x] 多選題測驗  
  - [x] 是非題測驗
  - [x] 動態答案類型處理
  - [x] 即時評分與結果分析

- **PVQC 多階段測驗** 🆕
  - [x] 測驗一：寫（看中拼英）
  - [x] 測驗二：讀（看英選中）
  - [x] 測驗三：聽（聽英選中）
  - [x] 測驗四：聽（聽英選英）
  - [x] 測驗五：聽（看中選發音）
  - [x] 自訂測驗組合與參數設定

### 📚 題庫

- **資訊安全** - 單選題型，208 題
- **PVQC AI** - 單字題型，227 題
- **會計學（一）** - 單選題型，103 題
- **AIL 證照檢定（單選）** - 單選題型，141 題
- **AIL 證照檢定（多選）** - 多選題型，63 題
- **AIL 證照檢定（是非）** - 是非題型，29 題

### 📊 歷史記錄

- [x] 完整測驗歷史記錄
- [x] 詳細評分報告
- [x] 階段分組顯示
- [x] 錯誤題目回顧

### ⚙️ 系統特色

- [x] 完整 TypeScript 型別系統
- [x] 響應式設計，支援多裝置
- [x] 資料遷移與向後相容
- [x] 策略模式評分系統
- [x] 現代化 UI/UX 設計
- [ ] 離線使用（即將支援）

## 🛠 技術架構

### 前端技術棧

- **框架**: React 18.3.1 + TypeScript
- **路由**: React Router Dom 6.27.0
- **樣式**: SCSS/Sass 1.80.4
- **狀態管理**: React Context API + Hooks
- **建置工具**: Create React App + React Scripts

### 後端服務

- **託管**: Firebase Hosting
- **儲存**: LocalStorage（目前）
- **資料庫**: Firestore（規劃中）

### 架構設計原則

- **分離關注點**：題目資料、題型定義、測驗模式、測驗流程分離
- **TypeScript Discriminated Union**：確保型別安全
- **策略模式**：支援不同題型的評分和處理邏輯
- **Feature-based 架構**：模組化程式碼組織

## 📁 專案結構

```plaintext
src/
├── types/              # TypeScript 型別定義
│   ├── questions.ts    # 題目型別系統
│   ├── quiz-modes.ts   # 測驗模式配置
│   ├── quiz-flows.ts   # 測驗流程配置
│   ├── answers.ts      # 答案處理系統
│   └── index.ts        # 歷史記錄型別
├── components/         # 共用元件
├── pages/              # 頁面元件
│   ├── Home/           # 首頁
│   ├── Quiz/           # 測驗頁面
│   ├── PVQC/           # PVQC 測驗設定
│   ├── Bank/           # 題庫瀏覽
│   ├── History/        # 歷史記錄
│   └── Settings/       # 系統設定
├── context/            # React Context
├── utils/              # 工具函數
│   ├── scoring.ts      # 評分策略
│   ├── detailed-results.ts # 結果分析
│   └── migrate-subjects.ts # 資料遷移
├── data/               # 題庫資料
└── styles/             # 全域樣式
```

## 版本歷程

### v2.0.0 Beta（目前版本）

- 完整 TypeScript 遷移
- PVQC 多階段測驗系統
- 策略模式評分系統
- 詳細結果分析功能

### v1.1.8（舊版本）

- 基礎測驗功能
- 單選題支援
- 簡單歷史記錄

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！請遵循以下規範：

1. 使用 TypeScript 進行開發
2. 遵循現有的程式碼風格
3. 新增功能需包含適當的型別定義
4. 提交前請確保沒有 TypeScript 錯誤

## 授權

本專案為中臺科技大學資管系內部使用，請勿用於商業用途。

## 📞 聯絡資訊

如有問題或建議，請聯絡開發者：[johnlin@johnlin.me](mailto:johnlin@johnlin.me)

---

**Practions** - 讓練習變得更有效率 🚀
