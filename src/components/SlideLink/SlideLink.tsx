import React from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { useSlideNavigate, type SlideDirection } from '@/hooks/useSlideNavigate'

interface SlideLinkProps extends LinkProps {
  to: string
  // 預設是進到下一層；回上一層（標題上方的「設定 /」這類連結）用 pop
  direction?: SlideDirection
}

/**
 * [component] SlideLink
 * 換頁時有轉場的連結（見 useSlideNavigate）
 * @returns {React.ReactElement} - 連結
 */
function SlideLink({
  to,
  direction = 'push',
  onClick,
  ...props
}: SlideLinkProps): React.ReactElement {
  const slideTo = useSlideNavigate()
  return (
    <Link
      to={to}
      onClick={(event) => {
        onClick?.(event)
        event.preventDefault()
        slideTo(to, direction)
      }}
      {...props}
    />
  )
}

export default SlideLink
