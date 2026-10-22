import { useNavigate, type NavigateOptions } from 'react-router-dom'

/**
 * 換頁轉場的種類（App.scss 依此決定動畫）：
 * tab-forward／tab-back：導覽列切換分頁，往後面的分頁時兩個畫面並排往左推，往前面的往右推。
 * push：進到下一層，原本的畫面不動，新畫面從右邊蓋上來；pop：回上一層，往右滑走露出原本的畫面。
 * jump：兩個獨立頁面之間跳轉，原本的畫面縮小淡出，新畫面放大淡入。
 * up：打開題庫、測驗紀錄的詳情頁，從底部滑入；down：關閉，往下滑出
 */
export type SlideDirection =
  | 'tab-forward'
  | 'tab-back'
  | 'push'
  | 'pop'
  | 'jump'
  | 'up'
  | 'down'

// 連點時只讓最後一次轉場清掉方向標記
let slideCount = 0

/**
 * 在 <html> 標上方向（App.scss 依此決定動畫），整個轉場結束後才清掉。
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

/** 換頁時加上轉場：導覽列、進出第二層、獨立頁面跳轉、開關詳情頁共用 */
export function useSlideNavigate(): (
  to: string,
  direction?: SlideDirection,
  options?: NavigateOptions,
) => void {
  const navigate = useNavigate()
  return (to, direction = 'push', options) =>
    slide(direction, () => navigate(to, { ...options, flushSync: true }))
}
