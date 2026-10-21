import { useNavigate } from 'react-router-dom'

/**
 * forward：往後面的分頁或下一層，新畫面從右邊淡入；back：反過來。
 * up：打開題庫、測驗紀錄的詳情頁，從底部滑入；down：關閉，往下滑出
 */
export type SlideDirection = 'forward' | 'back' | 'up' | 'down'

// 連點時只讓最後一次轉場清掉方向標記
let slideCount = 0

/**
 * 在 <html> 標上方向（App.scss 依此決定新畫面從哪一邊淡入），整個轉場結束後才清掉。
 * 太早清掉的話，還沒收掉的舊畫面會失去動畫，突然又出現在畫面上
 */
function slide(direction: SlideDirection, update: () => void): void {
  // 不支援頁面轉場的瀏覽器直接切換
  if (!document.startViewTransition) {
    update()
    return
  }
  const root = document.documentElement
  const count = ++slideCount
  root.setAttribute('data-nav', direction)
  document.startViewTransition(update).finished.finally(() => {
    if (count === slideCount) root.removeAttribute('data-nav')
  })
}

/** 換頁轉場：導覽列切換分頁、進出二級畫面、開關詳情頁共用 */
export function useSlideNavigate(): (
  to: string,
  direction?: SlideDirection,
) => void {
  const navigate = useNavigate()
  return (to, direction = 'forward') =>
    slide(direction, () => navigate(to, { flushSync: true }))
}
