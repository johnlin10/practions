import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.scss'
import InstallBanner from '@/components/InstallBanner/InstallBanner'
import packageJson from '../../../package.json'

// 合作聯絡信箱（與設定頁相同）
const CONTACT_EMAIL = 'johnlin@johnlin.me'

// 平台特色
const features = [
  { icon: 'bolt', title: '打開就練', text: '不用帳號，選好題庫直接開始' },
  {
    icon: 'install_mobile',
    title: '安裝成 App',
    text: '加入主畫面後全螢幕使用，沒有網路也能練習',
  },
  {
    icon: 'visibility',
    title: '答案全公開',
    text: '題庫、答案、測驗紀錄都能查看，錯題隨時回頭複習',
  },
]

/**
 * [page] Home page
 * 首頁頁面
 */
function Home(): React.ReactElement {
  const navigate = useNavigate()

  //* 背景矩形動畫效果
  useEffect(() => {
    // 選取所有背景矩形元素
    const squares = document.querySelectorAll(
      '.square-1, .square-2, .square-3, .square-4',
    ) as NodeListOf<HTMLElement>

    // 動畫函數
    const animate = (): void => {
      squares.forEach((square) => {
        // 隨機生成 x 座標和 y 座標
        const x = (Math.random() - 0.5) * 600
        const y = (Math.random() - 0.5) * 600
        // 隨機生成旋轉角度
        const rotation = (Math.random() - 0.5) * 90

        // 設定矩形元素的 transform 屬性
        setTimeout(() => {
          square.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`
        }, 100)
      })
    }

    // 初始化動畫
    animate()
    // 每 8 秒執行一次動畫
    const intervalId = setInterval(animate, 8000)

    // 清理動畫
    return () => clearInterval(intervalId)
  }, [])

  //* 標題點擊事件
  const handleTitleClick = (): void => {
    // 重新整理頁面
    window.location.reload()
  }

  //* 捲動提示點擊事件：捲到平台介紹
  const handleScrollHintClick = (): void => {
    document
      .getElementById('home-intro')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 onClick={handleTitleClick}>Practions</h1>
        <p>Practice Questions</p>

        {/* PVQC 測驗入口 */}
        <button
          className="pvqc-entrance-btn"
          onClick={() => navigate('/pvqc')}
          title="前往 PVQC 測驗設定"
        >
          <span className="hot-badge">HOT</span>
          <span className="material-symbols-rounded">psychology</span>
          PVQC 測驗
        </button>

        <button className="scroll-hint" onClick={handleScrollHintClick}>
          認識 Practions
          <span className="material-symbols-rounded">keyboard_arrow_down</span>
        </button>
      </div>

      {/* 平台介紹 */}
      <div className="home-intro" id="home-intro">
        <section className="intro-group">
          <h5>初衷</h5>
          <div className="intro-text">
            <p>
              學校的題庫系統登入麻煩、操作不便，想多練幾題，卻得先繞一大圈。
            </p>
            <p>
              Practions 只做一件事：<strong>打開就能練</strong>
              。不用註冊、不用登入，題庫和答案都在這裡。
            </p>
          </div>
        </section>

        <section className="intro-group intro-features">
          <h5>特色</h5>
          {features.map((feature) => (
            <div className="intro-feature" key={feature.title}>
              <span className="material-symbols-rounded">{feature.icon}</span>
              <div>
                <h4>{feature.title}</h4>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="intro-group intro-teacher">
          <h5>
            <span className="material-symbols-rounded">school</span>給老師
          </h5>
          <h3>
            Practions 是練習平台，
            <br />
            不是考核平台
          </h3>
          <p>
            為了讓練習盡量簡單，這裡沒有帳號：答案全部公開，測驗紀錄只存在各自的裝置上，無法確認是誰作答。
          </p>
          <div className="intro-fit">
            <div className="fit-yes">
              <h4>
                <span className="material-symbols-rounded">check_circle</span>
                適合
              </h4>
              <ul>
                <li>課後自主練習</li>
                <li>考前複習</li>
                <li>熟悉題型</li>
              </ul>
            </div>
            <div className="fit-no">
              <h4>
                <span className="material-symbols-rounded">cancel</span>
                不適合
              </h4>
              <ul>
                <li>出題考核</li>
                <li>計入成績</li>
                <li>確認作答身分</li>
              </ul>
            </div>
          </div>
          <div className="intro-lock">
            <span className="material-symbols-rounded">lock_clock</span>
            <div>
              <h4>正式考試期間可以鎖定</h4>
              <p>
                事先告訴我考試的科目與時間，考試期間該科目的題庫、測驗與測驗紀錄都會暫時鎖住，時間一過自動解鎖，避免學生考試時開來查答案。
              </p>
            </div>
          </div>
          <p className="intro-teacher-foot">
            歡迎推薦給同學，當作課後練習的工具。
          </p>
        </section>

        <section className="intro-group intro-contact">
          <h5>
            <span className="material-symbols-rounded">handshake</span>合作
          </h5>
          <h3>想讓同學在這裡練習？</h3>
          <p>直接寄信給我：可以約時間聊聊，也可以把題庫檔案直接附在信裡。</p>
          <div className="intro-contact-list">
            <p>信中可以附上</p>
            <ul>
              <li>課程或科目名稱</li>
              <li>題庫檔案（Word、Excel、PDF 等文字檔；請避免圖片或掃描檔）</li>
              <li>希望同學開始練習的時間</li>
              <li>正式考試時間（需要鎖定的話）</li>
            </ul>
          </div>
          <a
            className="intro-contact-btn"
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Practions 題庫合作')}`}
          >
            <span className="material-symbols-rounded">mail</span>
            寄信聯絡
          </a>
          <p className="intro-contact-email">{CONTACT_EMAIL}</p>
        </section>

        <p className="home-version">
          Practions v{packageJson.version}
          <br />© 2025–{new Date().getFullYear()} Practions. All rights
          reserved.
        </p>
      </div>

      <div className="square-1"></div>
      <div className="square-2"></div>
      <div className="square-3"></div>
      <div className="square-4"></div>

      <InstallBanner />
    </div>
  )
}

export default Home
