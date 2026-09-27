import { createBrowserRouter, Navigate } from 'react-router-dom'

import App from './App'

// pages
import Home from './pages/Home/Home'
import Quiz from './pages/Quiz/Quiz'
import Bank from './pages/Bank/Bank'
import SingleBank from './pages/Bank/ui/SingleBank'
import History from './pages/History/History'
import SingleHistory from './pages/History/ui/SingleHistory'
import Settings from './pages/Settings/Settings'
import PVQCSetup from './pages/PVQC/PVQCSetup'
import Install from './pages/Install/Install'
import Changelog from './pages/Changelog/Changelog'

// components
import { RouteErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

// data router：頁面轉場（viewTransition）與捲動位置還原（ScrollRestoration）都只支援 data router
export const router = createBrowserRouter(
  [
    {
      element: <App />,
      errorElement: <RouteErrorBoundary />,
      children: [
        { path: '/', element: <Home /> },
        { path: '/quiz', element: <Quiz /> },
        { path: '/quiz/:subjectId', element: <Quiz /> },
        { path: '/pvqc', element: <PVQCSetup /> },
        {
          path: '/history',
          element: <History />,
          children: [{ path: ':id', element: <SingleHistory /> }],
        },
        {
          path: '/bank',
          element: <Bank />,
          children: [{ path: ':subjectId', element: <SingleBank /> }],
        },
        { path: '/settings', element: <Settings /> },
        { path: '/settings/install', element: <Install /> },
        { path: '/settings/changelog', element: <Changelog /> },
        // 未知路徑導回首頁
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
)
