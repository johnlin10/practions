import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.scss'

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
      '.square-1, .square-2, .square-3, .square-4'
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
          <span className="new-badge">NEW</span>
          <span className="material-symbols-rounded">psychology</span>
          PVQC 測驗
        </button>
      </div>

      <div className="square-1"></div>
      <div className="square-2"></div>
      <div className="square-3"></div>
      <div className="square-4"></div>
    </div>
  )
}

export default Home
