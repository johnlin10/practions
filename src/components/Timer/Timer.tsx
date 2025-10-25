import React, { useState, useEffect, useRef } from 'react'
import './Timer.scss'

// interfaces
interface TimerProps {
  // 計時器持續時間（分鐘）
  duration: number
  // 時間結束時的回調函數
  onTimeUp: () => void
}

/**
 * [component] Timer component
 * 提供倒數計時功能，支援頁面切換時的時間同步
 * @param {TimerProps} props - 計時器屬性
 * @param {number} props.duration - 計時器持續時間（分鐘）
 * @param {() => void} props.onTimeUp - 時間結束時的回調函數
 * @returns {React.ReactElement} - 倒數計時器元件
 */
function Timer({ duration, onTimeUp }: TimerProps): React.ReactElement {
  // 剩餘時間（秒）
  const [timeLeft, setTimeLeft] = useState<number>(duration * 60)
  // 結束時間的參考
  const endTimeRef = useRef<number>(Date.now() + duration * 60 * 1000)
  // 動畫幀請求的參考
  const requestRef = useRef<number>()
  // 保存最新的 onTimeUp 回調
  const onTimeUpRef = useRef(onTimeUp)
  // 標記計時器是否已經觸發過
  const hasTriggeredRef = useRef(false)

  // 確保 onTimeUpRef 總是指向最新的回調
  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  // 初始化計時器（只在 duration 變化時重置）
  useEffect(() => {
    // 防止無效的 duration
    if (duration <= 0) {
      return
    }

    // 重置狀態
    const totalSeconds = duration * 60
    setTimeLeft(totalSeconds)
    endTimeRef.current = Date.now() + totalSeconds * 1000
    hasTriggeredRef.current = false

    const updateTimer = (): void => {
      // 如果已經觸發過，不再繼續
      if (hasTriggeredRef.current) {
        return
      }

      // 獲取當前時間
      const now = Date.now()
      // 計算剩餘時間
      const remaining = Math.ceil((endTimeRef.current - now) / 1000)

      // 如果時間到了，調用 onTimeUp
      if (remaining <= 0) {
        setTimeLeft(0)
        hasTriggeredRef.current = true
        onTimeUpRef.current()
        return
      }

      // 更新剩餘時間
      setTimeLeft(remaining)
      // 請求下一幀動畫
      requestRef.current = requestAnimationFrame(updateTimer)
    }

    // 處理頁面切換
    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        // 如果頁面隱藏，取消動畫幀
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current)
        }
      } else {
        // 重新計算結束時間（使用當前的 timeLeft）
        const currentTimeLeft = Math.ceil(
          (endTimeRef.current - Date.now()) / 1000
        )
        // 如果剩餘時間大於 0，則重新計算結束時間
        if (currentTimeLeft > 0) {
          endTimeRef.current = Date.now() + currentTimeLeft * 1000
          // 請求動畫幀
          requestRef.current = requestAnimationFrame(updateTimer)
        }
      }
    }

    // 添加事件監聽器
    document.addEventListener('visibilitychange', handleVisibilityChange)
    requestRef.current = requestAnimationFrame(updateTimer)

    // 清理函數
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [duration]) // 只依賴 duration

  // 計算分鐘和秒數
  const minutes = Math.floor(timeLeft / 60)
  // 計算秒數
  const seconds = timeLeft % 60

  // 渲染倒數計時器
  return (
    <div className="timer">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}

export default Timer
