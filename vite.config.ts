import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  INSTALL_PATH,
  INSTALL_TITLE,
  INSTALL_DESCRIPTION,
} from './src/pages/Install/meta'

/**
 * 建置後複製 index.html 為 settings/install.html，換上教學頁的標題與描述，
 * 讓不跑 JS 的 bot 也讀得到。Firebase Hosting 需開啟 cleanUrls，
 * /settings/install 才會回傳這個檔案
 */
function installPageHtml(): Plugin {
  return {
    name: 'install-page-html',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'build')
      let html = fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8')
      const replacements: [RegExp, string][] = [
        [/<title>.*?<\/title>/, `<title>${INSTALL_TITLE}</title>`],
        [
          /(<meta name="description" content=")[^"]*/,
          `$1${INSTALL_DESCRIPTION}`,
        ],
        [/(<meta property="og:title" content=")[^"]*/, `$1${INSTALL_TITLE}`],
        [
          /(<meta property="og:description" content=")[^"]*/,
          `$1${INSTALL_DESCRIPTION}`,
        ],
        [
          /(<meta property="og:url" content="https:\/\/practions\.web\.app)\/"/,
          `$1${INSTALL_PATH}"`,
        ],
      ]
      for (const [pattern, value] of replacements) {
        // index.html 的 meta 改過格式時直接中斷建置，避免默默產生沒換到的頁面
        if (!pattern.test(html))
          throw new Error(`install-page-html: 找不到 ${pattern}`)
        html = html.replace(pattern, value)
      }
      const file = path.join(outDir, `${INSTALL_PATH}.html`)
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, html)
    },
  }
}

/**
 * 讀取 git 中標題以 v*.*.* 開頭的提交，作為設定頁的更新紀錄（新到舊）
 * 在 dev 啟動與 build 時執行一次；需在 git repo 中建置
 */
function readChangelog(): ChangelogEntry[] {
  // 以 \x1f 分隔欄位、\x1e 分隔提交，避免與提交內容衝突
  const log = execSync(
    'git log --format=%h%x1f%ad%x1f%s%x1f%b%x1e --date=short',
    {
      encoding: 'utf-8',
    },
  )
  const entries: ChangelogEntry[] = []
  for (const record of log.split('\x1e')) {
    const [hash, date, subject, body = ''] = record.trim().split('\x1f')
    const match = subject?.match(
      /^(v\d+\.\d+\.\d+(?: Beta(?: \d+)?)?)[\s：:]*(.*)$/,
    )
    if (!match) continue
    entries.push({
      hash,
      date,
      version: match[1],
      title: match[2],
      // 移除 Co-Authored-By 等署名行
      body: body
        .replace(/^(Co-Authored-By|🤖 Generated with).*$/gim, '')
        .trim(),
    })
  }
  return entries
}

export default defineConfig({
  plugins: [react(), installPageHtml()],
  define: {
    __CHANGELOG__: JSON.stringify(readChangelog()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'build', // 沿用 build/，firebase.json 不需要改
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
