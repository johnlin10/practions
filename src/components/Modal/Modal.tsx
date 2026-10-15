import React, { useEffect, useId, useRef, useState } from 'react'
import './Modal.scss'

interface ModalProps {
  // 是否開啟；改成 false 時播放關閉動畫再關
  open: boolean
  // 按 Esc 或點背景時呼叫，由使用的地方把 open 改成 false
  onClose: () => void
  title: string
  className?: string
  // 固定在底部的按鈕（不跟著內容捲動）
  actions?: React.ReactNode
  // 內容本身負責捲動（overflow-y: auto），上下會被標題與按鈕的漸變蓋住一點
  children: React.ReactNode
}

/**
 * [component] Modal
 * 小彈窗（隨手練的題庫清單、題庫的掌握度），外觀與動畫同全站彈窗（Dialog）。
 * 使用原生 <dialog>：焦點鎖在彈窗內、背景無法操作、Esc 關閉都由瀏覽器處理。
 */
function Modal({
  open,
  onClose,
  title,
  className,
  actions,
  children,
}: ModalProps): React.ReactElement {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      setClosing(false)
      dialog.showModal()
      // showModal 會把焦點放到第一個可聚焦的元素，可捲動的內容也算，會畫出一圈焦點框；
      // 改放在彈窗本身，按 Tab 一樣能進到裡面的按鈕
      dialog.focus()
    } else if (!open && dialog.open) {
      setClosing(true)
    }
  }, [open])

  const handleAnimationEnd = (e: React.AnimationEvent): void => {
    // 背景（::backdrop）的動畫也會在 <dialog> 上觸發，只看彈窗本體的
    if (e.target !== e.currentTarget || e.nativeEvent.pseudoElement) return
    if (!closing) return
    ref.current?.close()
    setClosing(false)
  }

  return (
    <dialog
      ref={ref}
      className={`modal${className ? ` ${className}` : ''}${closing ? ' closing' : ''}`}
      aria-labelledby={titleId}
      tabIndex={-1}
      // Esc：改為播放關閉動畫再關
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // 點背景（彈窗本體之外）關閉
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onAnimationEnd={handleAnimationEnd}
    >
      <h3 id={titleId}>{title}</h3>
      {children}
      {actions && <div className="modal-actions">{actions}</div>}
    </dialog>
  )
}

export default Modal
