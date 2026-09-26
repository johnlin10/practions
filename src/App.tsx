import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.scss'

// pages
import Home from './pages/Home/Home'
import Quiz from './pages/Quiz/Quiz'
import Bank from './pages/Bank/Bank'
import History from './pages/History/History'
import Settings from './pages/Settings/Settings'
import PVQCSetup from './pages/PVQC/PVQCSetup'
import Install from './pages/Install/Install'
import Changelog from './pages/Changelog/Changelog'

// components
import BottomNav from './components/BottomNav/BottomNav'
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
      <BottomNav />
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
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/install" element={<Install />} />
        <Route path="/settings/changelog" element={<Changelog />} />
        {/* 未知路徑導回首頁 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
