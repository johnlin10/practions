import React, { useEffect, useRef, useState } from 'react'
import './Dialog.scss'
import { closeDialog, useDialog } from '@/utils/dialog'

/**
 * [component] Dialog
 * 顯示 showAlert / showConfirm 排入的彈窗，放在 App 裡全站共用一個。
 * 使用原生 <dialog>：焦點鎖在彈窗內、背景無法操作、Esc 關閉都由瀏覽器處理。
 */
function Dialog(): React.ReactElement | null {
  const request = useDialog()
  const ref = useRef<HTMLDialogElement>(null)
  // 正在播放關閉動畫時的結果；null 表示未關閉
  const [result, setResult] = useState<boolean | null>(null)

  useEffect(() => {
    if (request && !ref.current?.open) ref.current?.showModal()
  }, [request])

  if (!request) return null

  const close = (ok: boolean): void => {
    if (result === null) setResult(ok)
  }

  const handleAnimationEnd = (e: React.AnimationEvent): void => {
    // 背景（::backdrop）的動畫也會在 <dialog> 上觸發，只看彈窗本體的
    if (e.target !== e.currentTarget || e.nativeEvent.pseudoElement) return
    if (result === null) return
    ref.current?.close()
    setResult(null)
    closeDialog(result)
  }

  return (
    <dialog
      ref={ref}
      className={`dialog${result === null ? '' : ' closing'}`}
      aria-labelledby={request.title ? 'dialog-title' : undefined}
      aria-describedby="dialog-message"
      // Esc：改為播放關閉動畫再關
      onCancel={(e) => {
        e.preventDefault()
        close(false)
      }}
      // 點背景（彈窗本體之外）視同取消
      onClick={(e) => {
        if (e.target === e.currentTarget) close(false)
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="dialog-body">
        {request.title && <h3 id="dialog-title">{request.title}</h3>}
        <p id="dialog-message">{request.message}</p>
      </div>
      <div className="dialog-actions">
        {request.cancelText && (
          <button onClick={() => close(false)}>{request.cancelText}</button>
        )}
        <button
          className={`dialog-confirm${request.danger ? ' danger' : ''}`}
          onClick={() => close(true)}
        >
          {request.confirmText}
        </button>
      </div>
    </dialog>
  )
}

export default Dialog
