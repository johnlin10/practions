import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import App from './App'
import { BrowserRouter } from 'react-router-dom'
import { QuizProvider } from './context/QuizContext'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Failed to find the root element')
}

const root = ReactDOM.createRoot(rootElement)
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QuizProvider>
        <App />
      </QuizProvider>
    </BrowserRouter>
  </React.StrictMode>
)
