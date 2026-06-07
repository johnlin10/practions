import React from 'react'
import ReactDOM from 'react-dom/client'
import '@/index.scss'
import App from '@/App'
import { BrowserRouter } from 'react-router-dom'
import { QuizProvider } from '@/context/QuizContext'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <QuizProvider>
          <App />
        </QuizProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
