# Practions

**Practice Questions** - 中臺科技大學資管系專用測驗系統

線上題庫測驗平台，提供多種題型測驗、PVQC 多階段與官方模擬測驗、題庫瀏覽及歷史紀錄查詢。可加入手機主畫面，像 App 一樣全螢幕使用。

🔗 [practions.web.app](https://practions.web.app)

## 核心功能

### 🎯 測驗系統

- **標準測驗**
  - [x] 單選題、多選題、是非題
  - [x] 限時作答、即時評分與結果分析

- **PVQC 多階段測驗**
  - [x] 測驗一：寫（看中拼英）
  - [x] 測驗二：讀（看英選中）
  - [x] 測驗三：聽（聽英選中）
  - [x] 測驗四：聽（聽英選英）
  - [x] 測驗五：聽（看中選發音）
  - [x] 測驗六：讀聽（看英聽選發音）
  - [x] 自訂測驗組合、題數與時間
  - [x] 官方模擬：依官方規範每段 100 題、限時、及格分數，可選考 Spelling
  - [x] 語音播放（TTS）

### 📚 題庫

共 8 個題庫、1,961 題：

| 題庫                 | 題型 | 題數 |
| -------------------- | ---- | ---: |
| 企業資源規劃 ERP     | 單選 |  690 |
| PVQC 醫療照護        | 單字 |  500 |
| PVQC AI              | 單字 |  227 |
| 資訊安全             | 單選 |  208 |
| AIL 證照檢定（單選） | 單選 |  141 |
| 會計學（一）         | 單選 |  103 |
| AIL 證照檢定（多選） | 多選 |   63 |
| AIL 證照檢定（是非） | 是非 |   29 |

### 📊 歷史紀錄

- [x] 完整測驗歷史與詳細評分報告
- [x] 多階段測驗依階段分組顯示
- [x] 錯誤題目回顧
- [x] 題目快照去重儲存，大幅縮小紀錄大小，舊紀錄自動相容
- [x] 讀取時以 zod 驗證資料格式

### 📱 PWA

- [x] 加入主畫面，全螢幕使用
- [x] 「加入主畫面」教學頁（iPhone 附操作影片、Android 支援一鍵安裝）
- [x] 首頁依裝置自動顯示安裝提示
- [x] 從主畫面開啟時顯示首屏畫面
- [ ] 離線使用

## 🛠 技術架構

### 前端

- **框架**：React 18 + TypeScript 6
- **路由**：React Router 6
- **樣式**：SCSS
- **狀態管理**：React Context + Hooks
- **資料驗證**：zod
- **建置工具**：Vite 8
- **測試**：Vitest + Testing Library
- **程式碼品質**：ESLint + Prettier

### 後端服務

- **託管**：Firebase Hosting
- **儲存**：LocalStorage
- **資料庫**：Firestore（規劃中）

### 架構設計原則

- **分離關注點**：題目資料、題型定義、測驗模式、測驗流程分離
- **TypeScript Discriminated Union**：確保型別安全
- **策略模式**：支援不同題型的評分與處理邏輯
- **Feature-based 架構**：模組化程式碼組織

## 🚀 開發

使用 [pnpm](https://pnpm.io)：

```bash
pnpm install
```

| 指令                | 說明                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | 啟動開發伺服器                            |
| `pnpm build`        | 建置到 `build/`                           |
| `pnpm test`         | 執行測試                                  |
| `pnpm lint`         | ESLint 檢查                               |
| `pnpm format`       | Prettier 格式化                           |
| `pnpm build-deploy` | 建置並部署到 Firebase Hosting             |
| `pnpm og-image`     | 由 `scripts/og-image.html` 產生社群分享圖 |

`firebase.json` 不在版本控制中，部署前需自行準備（`public` 設為 `build`，並將所有路徑 rewrite 到 `/index.html`）。

## 📁 專案結構

```plaintext
src/
├── types/              # TypeScript 型別定義（題目、測驗模式、測驗流程、答案、設定）
├── schemas/            # zod 資料驗證（歷史紀錄、設定）
├── components/         # 共用元件（底部導航、計時器、結果頁、安裝提示）
├── pages/              # 頁面元件
│   ├── Home/           # 首頁
│   ├── Quiz/           # 測驗頁面
│   ├── PVQC/           # PVQC 測驗設定
│   ├── Bank/           # 題庫瀏覽
│   ├── History/        # 歷史紀錄
│   ├── Settings/       # 設定
│   └── Install/        # 加入主畫面教學
├── context/            # React Context
├── hooks/              # 自訂 Hooks（歷史紀錄、設定、PWA 安裝）
├── data/               # 題庫、PVQC 官方規範、歷史紀錄與設定的儲存
├── utils/              # 評分策略、結果分析、儲存、語音播放
└── styles/             # 共用樣式
```

## 版本歷程

### v2.4（目前版本）

- 歷史紀錄改用題目快照去重儲存，大幅縮小紀錄大小

### v2.3

- 首頁安裝提示，依裝置提供一鍵安裝、教學或從主畫面開啟的提醒
- 從主畫面開啟時的首屏畫面

### v2.2

- 「加入主畫面」教學頁（iOS 影片教學、Android 一鍵安裝）
- PWA manifest 補齊圖示、截圖與描述

### v2.1

- PVQC 支援多科別題庫，新增「PVQC 醫療照護」
- PVQC 測驗五、六操作改善，修正 iOS Safari 底部被工具列遮住

### v2.0

- 完整 TypeScript 遷移、PVQC 多階段測驗、策略模式評分
- 語音播放、PVQC 測驗六、設定系統
- 工具鏈現代化（CRA → Vite、npm → pnpm、Vitest），zod 集中化資料存取層

### v1.1.8（舊版本）

- 基礎測驗功能、單選題、簡單歷史紀錄

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！請遵循以下規範：

1. 使用 TypeScript 進行開發
2. 遵循現有的程式碼風格（`pnpm lint`、`pnpm format`）
3. 新增功能需包含適當的型別定義
4. 提交前請確保型別檢查與測試通過

## 授權

本專案為中臺科技大學資管系內部使用，請勿用於商業用途。

## 📞 聯絡資訊

如有問題或建議，請聯絡開發者：[johnlin@johnlin.me](mailto:johnlin@johnlin.me)

---

**Practions** - 讓練習變得更有效率 🚀
