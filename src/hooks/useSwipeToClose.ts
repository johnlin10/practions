import { useEffect, useRef, type RefObject } from 'react'

// 拉超過這個距離（畫面實際移動的 px）放開就關閉
const CLOSE_DISTANCE = 120
// 或是往下甩得夠快（px/ms），拉的距離短也關閉
const CLOSE_VELOCITY = 0.5
// 手指移動超過這個距離才判斷是不是往下拉，避免點擊時誤觸
const START_SLOP = 8
// 畫面跟著手指移動的比例，有一點阻力
const DAMPING = 0.7
const SPRING_BACK = 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)'

/**
 * 從底部滑入的頁面：捲到最上面時往下拉，整頁跟著手指移動，拉夠了放開就關閉，不夠就彈回。
 * 頁面要自己用 overscroll-behavior-y: none 關掉 Safari 的下拉重新整理與回彈（見 App.scss）。
 */
export function useSwipeToClose(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  // 每次 render 的 onClose 都是新的函式，放在 ref 裡，手勢監聽不用重新綁定
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    let startX = 0
    let startY = 0
    let startTime = 0
    // idle：沒在拉；pending：剛按下還沒判斷方向；dragging：整頁跟著手指
    let state: 'idle' | 'pending' | 'dragging' = 'idle'
    let offset = 0

    const onStart = (e: TouchEvent): void => {
      const target = e.target as Element
      // 彈窗、輸入框裡的觸控不算；已經往下捲了就是一般捲動
      if (
        e.touches.length > 1 ||
        window.scrollY > 0 ||
        target.closest('dialog, input, textarea')
      ) {
        state = 'idle'
        return
      }
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      state = 'pending'
    }

    const onMove = (e: TouchEvent): void => {
      const el = ref.current
      if (state === 'idle' || !el) return
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      if (state === 'pending') {
        if (Math.abs(dx) < START_SLOP && Math.abs(dy) < START_SLOP) return
        // 往上或橫向：交給一般捲動
        if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
          state = 'idle'
          return
        }
        state = 'dragging'
        startY = e.touches[0].clientY
        startTime = e.timeStamp
        el.style.transition = 'none'
        el.classList.add('swiping')
      }
      e.preventDefault()
      offset = Math.max(0, e.touches[0].clientY - startY) * DAMPING
      el.style.transform = `translateY(${offset}px)`
    }

    const onEnd = (e: TouchEvent): void => {
      const el = ref.current
      if (state !== 'dragging' || !el) {
        state = 'idle'
        return
      }
      state = 'idle'
      const velocity = offset / DAMPING / Math.max(1, e.timeStamp - startTime)
      const fling = velocity > CLOSE_VELOCITY && offset > 24
      if (e.type === 'touchend' && (offset > CLOSE_DISTANCE || fling)) {
        // 保留目前的位移，關閉轉場從這裡接著往下滑出。轉場拍下的整個畫面會包含頁面上方空出來的地方，
        // 滑出時要裁掉，不然會蓋住底下的列表（App.scss 的 .sheet-swipe-closing）
        const root = document.documentElement
        root.style.setProperty('--sheet-offset', `${offset}px`)
        root.classList.add('sheet-swipe-closing')
        const clear = (event: AnimationEvent): void => {
          if (event.animationName !== 'sheet-out') return
          root.style.removeProperty('--sheet-offset')
          root.classList.remove('sheet-swipe-closing')
          root.removeEventListener('animationend', clear)
        }
        root.addEventListener('animationend', clear)
        onCloseRef.current()
        return
      }
      el.style.transition = SPRING_BACK
      el.style.transform = ''
      // 位移是 0 時不會觸發 transitionend，用計時器收尾
      setTimeout(() => {
        el.style.transition = ''
        el.classList.remove('swiping')
      }, 350)
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    window.addEventListener('touchcancel', onEnd)
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onEnd)
    }
  }, [ref])
}
