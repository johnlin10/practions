import React, { useState, useEffect, useRef } from 'react'
import './Timer.scss'

/**
 * Timer component
 * @param {number} duration - duration of the timer in seconds
 * @param {function} onTimeUp - function to call when time is up
 * @returns {React.ReactElement} - Timer component
 */
function Timer({ duration, onTimeUp }) {
  // state for time left
  const [timeLeft, setTimeLeft] = useState(duration * 60)
  // state for end time
  const endTimeRef = useRef(Date.now() + duration * 60 * 1000)
  // state for request ref
  const requestRef = useRef()

  // update timer
  useEffect(() => {
    const updateTimer = () => {
      // get current time
      const now = Date.now()
      // get remaining time
      const remaining = Math.ceil((endTimeRef.current - now) / 1000)
      // if time is up, call onTimeUp
      if (remaining <= 0) {
        setTimeLeft(0)
        onTimeUp()
        return
      }

      // update time left
      setTimeLeft(remaining)
      // request animation frame
      requestRef.current = requestAnimationFrame(updateTimer)
    }

    // handle tab switch
    const handleVisibilityChange = () => {
      // if document is hidden, cancel animation frame
      if (document.hidden) {
        cancelAnimationFrame(requestRef.current)
      } else {
        // recalculate end time
        endTimeRef.current = Date.now() + timeLeft * 1000
        // request animation frame
        requestRef.current = requestAnimationFrame(updateTimer)
      }
    }

    // add event listener
    document.addEventListener('visibilitychange', handleVisibilityChange)
    requestRef.current = requestAnimationFrame(updateTimer)

    // cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cancelAnimationFrame(requestRef.current)
    }
  }, [duration, onTimeUp, timeLeft])

  // calculate minutes and seconds
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="timer">
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  )
}

export default Timer
