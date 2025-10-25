import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import './App.scss'

// pages
import Home from './pages/Home/Home'
import Quiz from './pages/Quiz/Quiz'
import Bank from './pages/Bank/Bank'
import History from './pages/History/History'
import Settings from './pages/Settings/Settings'
import PVQCSetup from './pages/PVQC/PVQCSetup'

// components
import Results from './components/Results/Results'
import Navigate from './components/Navigate/Navigate'
import SingleBank from './pages/Bank/ui/SingleBank'
import SingleHistory from './pages/History/ui/SingleHistory'

/**
 * App component
 * 應用程式的根元件，包含路由配置和全域設置
 */
function App(): React.ReactElement {
  useEffect(() => {
    // 清理舊版本的歷史記錄
    localStorage.removeItem('quizHistory-v2')

    // 檢查是否已經完成 v2 到 v3 的遷移
    if (localStorage.getItem('transfer-v2-to-v3')) {
      return
    }
    localStorage.setItem('transfer-v2-to-v3', 'true')
  }, [])

  return (
    <>
      <Navigate />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:subjectId" element={<Quiz />} />
        <Route path="/pvqc" element={<PVQCSetup />} />
        <Route path="/history" element={<History />}>
          <Route path=":id" element={<SingleHistory />} />
        </Route>
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
