import React from 'react'
import './ErrorBoundary.scss'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * [component] ErrorBoundary
 * 頂層錯誤邊界：攔截子樹的 render 期例外，顯示 fallback UI 而非整頁白屏。
 * React 的錯誤邊界必須是 class component。
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] 攔截到未處理的例外：', error, info)
  }

  private handleReload = (): void => {
    window.location.assign('/')
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <span className="material-symbols-rounded">error</span>
            <h1>發生未預期的錯誤</h1>
            <p>應用程式遇到問題，請嘗試重新載入。</p>
            {this.state.error?.message && (
              <pre className="error-boundary-detail">
                {this.state.error.message}
              </pre>
            )}
            <button onClick={this.handleReload}>回到首頁</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
