import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  // 不檢查的目錄
  {
    ignores: ['build', 'coverage', 'node_modules', 'public'],
  },

  // 應用程式碼（瀏覽器環境）
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // 採穩定版 recommended（含 rules-of-hooks 與 exhaustive-deps），
      // 不採 recommended-latest，避免實驗性的 set-state-in-effect / purity 大量誤報
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // 既有 any 技術債：設為 warn 以建立綠色基線，未來新增的 any 仍會被提醒
      '@typescript-eslint/no-explicit-any': 'warn',
      // 允許以 _ 前綴標示「刻意忽略」的變數/參數（含解構 omit 模式）
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // react-hooks v7 recommended 內建的兩條激進規則，會誤報本專案大量合法寫法
      // （setInterval 時鐘、從 props/localStorage 同步 state）；關閉以保持可用基線。
      // 真正抓 bug 的 rules-of-hooks 與 exhaustive-deps 仍保留啟用。
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },

  // 設定檔與 Node 腳本（Node 環境）
  {
    files: ['*.{js,mjs,ts}', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Prettier：關閉所有與格式化衝突的規則（務必放最後）
  prettier,
)
