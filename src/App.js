import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.scss'

// pages
import Home from './pages/Home/Home'
import Quiz from './pages/Quiz/Quiz'
import Bank from './pages/Bank/Bank'
import History from './pages/History/History'
import Settings from './pages/Settings/Settings'

// components
import Results from './components/Results/Results'
import Navigate from './components/Navigate/Navigate'
import SingleBank from './pages/Bank/ui/SingleBank'

function App() {
  useEffect(() => {
    localStorage.removeItem('quizHistory-v2')
    if (localStorage.getItem('transfer-v2-to-v3')) {
      return
    }
    localStorage.setItem('transfer-v2-to-v3', true)
  }, [])

  return (
    <>
      <Navigate />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:subjectId" element={<Quiz />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<History />} />
        <Route path="/results" element={<Results />} />
        <Route path="/bank" element={<Bank />}>
          <Route path=":subjectId" element={<SingleBank />} />
        </Route>
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

export default App
