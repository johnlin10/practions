import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import react from '@vitejs/plugin-react'
import {
  INSTALL_PATH,
  INSTALL_TITLE,
  INSTALL_DESCRIPTION,
} from './src/pages/Install/meta'
import {
  TRANSFER_PATH,
  TRANSFER_TITLE,
  TRANSFER_DESCRIPTION,
} from './src/pages/Transfer/meta'
import {
  PRIVACY_PATH,
  PRIVACY_TITLE,
  PRIVACY_DESCRIPTION,
  TERMS_PATH,
  TERMS_TITLE,
  TERMS_DESCRIPTION,
} from './src/pages/Legal/meta'

// 需要自己的標題與描述（分享連結預覽）的頁面
const PAGES = [
  {
    path: INSTALL_PATH,
    title: INSTALL_TITLE,
    description: INSTALL_DESCRIPTION,
  },
  {
    path: TRANSFER_PATH,
    title: TRANSFER_TITLE,
    description: TRANSFER_DESCRIPTION,
  },
  {
    path: PRIVACY_PATH,
    title: PRIVACY_TITLE,
    description: PRIVACY_DESCRIPTION,
  },
  { path: TERMS_PATH, title: TERMS_TITLE, description: TERMS_DESCRIPTION },
]

/**
 * 建置後為 PAGES 各複製一份 index.html（例如 settings/install.html），換上該頁的標題與描述，
 * 讓不跑 JS 的 bot（LINE、Facebook 等連結預覽）也讀得到。Firebase Hosting 需開啟 cleanUrls，
 * /settings/install 才會回傳這個檔案
 */
function pageHtml(): Plugin {
  return {
    name: 'page-html',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'build')
      const index = fs.readFileSync(path.join(outDir, 'index.html'), 'utf-8')
      for (const { path: pagePath, title, description } of PAGES) {
        let html = index
        const replacements: [RegExp, string][] = [
          [/<title>.*?<\/title>/, `<title>${title}</title>`],
          [/(<meta name="description" content=")[^"]*/, `$1${description}`],
          [/(<meta property="og:title" content=")[^"]*/, `$1${title}`],
          [
            /(<meta property="og:description" content=")[^"]*/,
            `$1${description}`,
          ],
          [
            /(<meta property="og:url" content="https:\/\/[^/"]+)\/"/,
            `$1${pagePath}"`,
          ],
        ]
        for (const [pattern, value] of replacements) {
          // index.html 的 meta 改過格式時直接中斷建置，避免默默產生沒換到的頁面
          if (!pattern.test(html))
            throw new Error(`page-html: 找不到 ${pattern}`)
          html = html.replace(pattern, value)
        }
        const file = path.join(outDir, `${pagePath}.html`)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, html)
      }
    },
  }
}

// Service Worker 預先快取的檔案：assets/ 全部（程式、樣式、字型），加上這些根目錄檔案
const PRECACHE_ROOT_FILES = [
  'index.html',
  'theme.css',
  'splash.png',
  'manifest.json',
]

/**
 * 建置後把預先快取清單與版本寫進 build/sw.js（原始檔在 public/sw.js）
 * 版本是清單內所有檔案內容的 hash：任何檔案有變，sw.js 就跟著變，瀏覽器才會發現新版
 */
function serviceWorker(): Plugin {
  return {
    name: 'service-worker',
    apply: 'build',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'build')
      const files = [
        ...PRECACHE_ROOT_FILES,
        ...fs
          .readdirSync(path.join(outDir, 'assets'))
          .map((f) => `assets/${f}`),
      ].sort()
      const hash = createHash('sha256')
      for (const file of files)
        hash.update(fs.readFileSync(path.join(outDir, file)))
      const version = hash.digest('hex').slice(0, 12)
      const appVersion = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
      ).version

      const swFile = path.join(outDir, 'sw.js')
      let sw = fs.readFileSync(swFile, 'utf-8')
      const replacements: [RegExp, string][] = [
        [/const VERSION = 'dev'/, `const VERSION = '${version}'`],
        [
          /const APP_VERSION = 'dev'/,
          `const APP_VERSION = ${JSON.stringify(appVersion)}`,
        ],
        [
          /const PRECACHE = \[\]/,
          `const PRECACHE = ${JSON.stringify(files.map((f) => `/${f}`))}`,
        ],
      ]
      for (const [pattern, value] of replacements) {
        // sw.js 的寫法改過時直接中斷建置，避免部署出沒有清單的 Service Worker
        if (!pattern.test(sw))
          throw new Error(`service-worker: 找不到 ${pattern}`)
        sw = sw.replace(pattern, value)
      }
      fs.writeFileSync(swFile, sw)
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
  plugins: [react(), pageHtml(), serviceWorker()],
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
