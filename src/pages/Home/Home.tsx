import React, { useEffect } from 'react'
import './Home.scss'
import InstallBanner from '@/components/InstallBanner/InstallBanner'
import { LearningLoop } from '@/components/LearningCycle/LearningCycle'
import { LEARNING_PATH, LEARNING_TITLE } from '@/pages/Learning/meta'
import packageJson from '../../../package.json'
import SlideLink from '@/components/SlideLink/SlideLink'

// 合作聯絡信箱（與設定頁相同）
const CONTACT_EMAIL = 'contact@practions.app'

// 能做什麼：Practions 的主要功能，點了直接打開那一頁
const features = [
  {
    icon: 'assignment_turned_in',
    title: '測驗',
    text: '課程與證照題庫，限時作答，交卷後看成績與答錯的題目',
    to: '/quiz',
  },
  {
    icon: 'psychology',
    title: 'PVQC',
    text: '六種作答方式，可以自選題型、題數和時間，也有官方模擬',
    to: '/pvqc',
  },
  {
    icon: 'exercise',
    title: '隨手練',
    text: '選好題庫就開始，不計時，答一題就看到對錯',
    to: '/practice',
  },
  {
    icon: 'replay',
    title: '錯題複習',
    text: '答錯的題自動收集起來，快忘記前再問你一次',
    to: '/practice',
  },
  {
    icon: 'library_books',
    title: '題庫',
    text: '所有題目和答案隨時都能查，也看得到每個題庫的掌握度',
    to: '/bank',
  },
]

// 用起來很方便：功能以外的使用體驗
const conveniences = [
  {
    icon: 'cloud_sync',
    title: '登入保存紀錄',
    text: '用 Google 登入，測驗紀錄存在雲端，換裝置也看得到',
  },
  {
    icon: 'install_mobile',
    title: '安裝成 App',
    text: '加入主畫面全螢幕使用，沒網路也能練',
  },
]

/**
 * [page] Home page
 * 首頁頁面
 */
function Home(): React.ReactElement {
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
        {/* Logo：透明底，方塊顏色跟著主題色；外框圓角同 App 圖示 */}
        <svg
          className="home-logo"
          viewBox="0 0 1024 1024"
          fill="currentColor"
          aria-hidden="true"
        >
          <clipPath id="home-logo-clip">
            <rect width="1024" height="1024" rx="225" />
          </clipPath>
          <path
            clipPath="url(#home-logo-clip)"
            d="M0 0H675V241H240V676H0ZM783 0H1024V241H783ZM348 349H675V676H348ZM783 349H1024V1024H348V784H783ZM0 784H240V1024H0Z"
          />
        </svg>
        <h1 onClick={handleTitleClick}>Practions</h1>
        <p>Practice Questions</p>

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
              考前想多練幾題，學校的測驗系統卻不太順手，光是操作就花掉不少時間。
            </p>
            <p>
              Practions 因此而生，希望練習能單純一點，
              <strong>把時間花在題目本身</strong>。
            </p>
            <p>
              但練過不代表記得住。所以 Practions
              也想幫你把練過的題目真正記下來，讓花下去的時間不白費。
            </p>
          </div>
        </section>

        <section className="intro-group intro-features">
          <h5>能做什麼</h5>
          {features.map((item) => (
            <SlideLink
              className="intro-feature no-style"
              key={item.title}
              to={item.to}
              // 從首頁跳到其他獨立的頁面
              direction="jump"
            >
              <span className="material-symbols-rounded">{item.icon}</span>
              <span>
                <span>{item.title}</span>
                <span>{item.text}</span>
              </span>
              <span className="material-symbols-rounded">chevron_right</span>
            </SlideLink>
          ))}
        </section>

        <section className="intro-group intro-plain">
          <h5>用起來很方便</h5>
          <div className="intro-conveniences">
            {conveniences.map((item) => (
              <div className="intro-convenience" key={item.title}>
                <span className="material-symbols-rounded">{item.icon}</span>
                <h4>{item.title}</h4>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="intro-group intro-plain">
          <h5>怎麼幫你記住</h5>
          <p>你只要照著練，哪些題目該再練一次，Practions 會幫你安排。</p>
          <LearningLoop />
          <SlideLink
            className="intro-learning-link no-style"
            to={LEARNING_PATH}
            direction="jump"
          >
            <span className="material-symbols-rounded">school</span>
            <span>
              <span>{LEARNING_TITLE}</span>
              <span>背後的學習原理與模擬測試</span>
            </span>
            <span className="material-symbols-rounded">chevron_right</span>
          </SlideLink>
        </section>

        {/* 給老師與合作：預設收合，同一時間只展開一個 */}
        <section className="intro-group intro-more">
          <details name="home-more">
            <summary>
              <span className="material-symbols-rounded">school</span>
              <span>
                <span>平台特性</span>
                <span>練習平台，而非考核平台</span>
              </span>
              <span className="material-symbols-rounded">expand_more</span>
            </summary>
            <div className="intro-teacher">
              <h3>
                Practions 是練習平台，
                <br />
                不是考核平台
              </h3>
              <p>
                為了讓練習盡量簡單，答案全部公開。登入只是用來保存自己的紀錄，測驗紀錄也只有作答的人自己看得到。老師無法查看，也無法確認是誰作答。
              </p>
              <div className="intro-fit">
                <div className="fit-yes">
                  <h4>
                    <span className="material-symbols-rounded">
                      check_circle
                    </span>
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
                    事先告訴 Practions
                    考試的科目與時間，考試期間該科目的題庫、測驗與測驗紀錄都會暫時鎖住，時間一過自動解鎖，避免學生在考試時拿來查答案。
                  </p>
                </div>
              </div>
              <p className="intro-teacher-foot">
                歡迎推薦給同學，當作課後練習的工具。
              </p>
            </div>
          </details>
          <details name="home-more">
            <summary>
              <span className="material-symbols-rounded">handshake</span>
              <span>
                <span>合作</span>
                <span>想讓同學在這裡練習？寄信給 Practions</span>
              </span>
              <span className="material-symbols-rounded">expand_more</span>
            </summary>
            <div className="intro-contact">
              <p>寄信給 Practions：將題庫檔案附在信裡。</p>
              <div className="intro-contact-list">
                <p>信中可以附上</p>
                <ul>
                  <li>課程或科目名稱</li>
                  <li>
                    題庫檔案（Word、Excel、PDF 等文字檔；請避免圖片或掃描檔）
                  </li>
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
            </div>
          </details>
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
