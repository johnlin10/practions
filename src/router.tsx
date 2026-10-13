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
import Review from './pages/Review/Review'
import Guide from './pages/Guide/Guide'
import Install from './pages/Install/Install'
import Learning from './pages/Learning/Learning'
import Changelog from './pages/Changelog/Changelog'
import Transfer from './pages/Transfer/Transfer'
import Privacy from './pages/Legal/Privacy'
import Terms from './pages/Legal/Terms'

// data
import { GUIDE_PATH } from './pages/Guide/meta'
import { INSTALL_PATH, INSTALL_LEGACY_PATH } from './pages/Install/meta'
import { TRANSFER_PATH, TRANSFER_LEGACY_PATH } from './pages/Transfer/meta'
import { LEARNING_PATH, LEARNING_LEGACY_PATH } from './pages/Learning/meta'
import { LEGACY_SUBJECTS } from './data/subjects'

// components
import { RouteErrorBoundary } from './components/ErrorBoundary/ErrorBoundary'

// 舊科目 ID 的網址（書籤、分享連結）轉到目前的科目
const legacyRedirects = (base: string) =>
  Object.entries(LEGACY_SUBJECTS).map(([oldId, { id }]) => ({
    path: `${base}/${oldId}`,
    element: <Navigate to={`${base}/${id}`} replace />,
  }))

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
        ...legacyRedirects('/quiz'),
        { path: '/pvqc', element: <PVQCSetup /> },
        { path: '/review', element: <Review /> },
        {
          path: '/history',
          element: <History />,
          children: [{ path: ':id', element: <SingleHistory /> }],
        },
        {
          path: '/bank',
          element: <Bank />,
          children: [
            { path: ':subjectId', element: <SingleBank /> },
            ...legacyRedirects('/bank'),
          ],
        },
        { path: '/settings', element: <Settings /> },
        { path: GUIDE_PATH, element: <Guide /> },
        { path: INSTALL_PATH, element: <Install /> },
        { path: TRANSFER_PATH, element: <Transfer /> },
        { path: LEARNING_PATH, element: <Learning /> },
        // 搬到使用指南前的網址（書籤、分享連結）
        ...[
          [INSTALL_LEGACY_PATH, INSTALL_PATH],
          [TRANSFER_LEGACY_PATH, TRANSFER_PATH],
          [LEARNING_LEGACY_PATH, LEARNING_PATH],
        ].map(([from, to]) => ({
          path: from,
          element: <Navigate to={to} replace />,
        })),
        { path: '/settings/changelog', element: <Changelog /> },
        { path: '/settings/privacy', element: <Privacy /> },
        { path: '/settings/terms', element: <Terms /> },
        // 未知路徑導回首頁
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { future: { v7_relativeSplatPath: true } },
)
