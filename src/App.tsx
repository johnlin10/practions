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

// data
import { runMigrations } from '@/data/migrations'

/**
 * App component
 * 應用程式的根元件，包含路由配置和全域設置
 */
function App(): React.ReactElement {
  useEffect(() => {
    // 執行跨版本資料遷移（集中於 data/migrations）
    runMigrations()
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
        <Route path="/bank" element={<Bank />}>
          <Route path=":subjectId" element={<SingleBank />} />
        </Route>
        <Route path="/results" element={<Results />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

export default App
