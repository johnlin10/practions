import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navigate from './components/Navigate'
import Home from './components/Home'
import Quiz from './components/Quiz'
import Results from './components/Results'
import History from './components/History'
import Bank from './components/Bank'
import './App.scss'

function App() {
  useEffect(() => {
    localStorage.removeItem('quizHistory-v2')
    if (localStorage.getItem('transfer-v2-to-v3')) {
      return
    }
    alert(
      '因作業疏失，導致先前測驗紀錄需重新紀錄，以確保後續獲得完整體驗！\n抱歉造成此困擾～'
    )
    localStorage.setItem('transfer-v2-to-v3', true)
  }, [])

  return (
    <>
      <Navigate />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:subjectId" element={<Quiz />} />
        <Route path="/results" element={<Results />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<History />} />
        <Route path="/bank" element={<Bank />} />
        <Route path="/bank/:subjectId" element={<Bank />} />
      </Routes>
    </>
  )
}

export default App
