import React, { useEffect } from 'react'
import '../styles/Home.scss'

function Home() {
  useEffect(() => {
    const squares = document.querySelectorAll(
      '.square-1, .square-2, .square-3, .square-4'
    )

    const animate = () => {
      squares.forEach((square) => {
        const x = (Math.random() - 0.5) * 600 // -150px 到 150px
        const y = (Math.random() - 0.5) * 600 // -150px 到 150px
        const rotation = (Math.random() - 0.5) * 90 // -22.5度 到 22.5度

        setTimeout(() => {
          square.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`
        }, 100)
      })
    }

    animate() // 初始動畫
    const intervalId = setInterval(animate, 8000) // 每7秒執行一次

    return () => clearInterval(intervalId) // 清理
  }, [])

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 onClick={() => window.location.reload(true)}>Practions</h1>
        <p>Practice Questions</p>
      </div>

      <div className="square-1"></div>
      <div className="square-2"></div>
      <div className="square-3"></div>
      <div className="square-4"></div>
    </div>
  )
}

export default Home
