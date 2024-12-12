import React, { useState, useEffect, useRef } from 'react'
import '../styles/Timer.scss'

function Timer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  const endTimeRef = useRef(Date.now() + duration * 60 * 1000)
  const requestRef = useRef()

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now()
      const remaining = Math.ceil((endTimeRef.current - now) / 1000)

      if (remaining <= 0) {
        setTimeLeft(0)
        onTimeUp()
        return
      }

      setTimeLeft(remaining)
      requestRef.current = requestAnimationFrame(updateTimer)
    }

    // 處理標籤頁切換
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(requestRef.current)
      } else {
        // 重新計算結束時間
        endTimeRef.current = Date.now() + timeLeft * 1000
        requestRef.current = requestAnimationFrame(updateTimer)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    requestRef.current = requestAnimationFrame(updateTimer)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(requestRef.current)
    }
  }, [duration, onTimeUp, timeLeft])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="timer">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}

export default Timer
