import React from 'react'
import './CollapsibleSection.scss'

// interfaces
interface CollapsibleSectionProps {
  // 標題
  title: React.ReactNode
  // 標題列右側的補充資訊（例如分數）
  extra?: React.ReactNode
  // 是否可展開 / 收合；否則為固定展開的一般段落
  collapsible?: boolean
  // 預設是否展開（僅在可收合時有效）
  defaultOpen?: boolean
  // 額外的 className
  className?: string
  // 內容
  children: React.ReactNode
}

/**
 * [component] CollapsibleSection component
 * 帶標題列的段落，可選擇是否能展開 / 收合
 * 以原生 <details> 實作，鍵盤操作與無障礙語意由瀏覽器提供
 * @param {CollapsibleSectionProps} props - 段落屬性
 * @returns {React.ReactElement} - 段落元件
 */
function CollapsibleSection({
  title,
  extra,
  collapsible = true,
  defaultOpen = false,
  className = '',
  children,
}: CollapsibleSectionProps): React.ReactElement {
  const header = (
    <>
      {collapsible && (
        <span className="material-symbols-rounded collapsible-section-icon">
          chevron_right
        </span>
      )}
      <h2 className="collapsible-section-title">{title}</h2>
      {extra && <div className="collapsible-section-extra">{extra}</div>}
    </>
  )

  if (!collapsible) {
    return (
      <section className={`collapsible-section ${className}`}>
        <div className="collapsible-section-header">{header}</div>
        {children}
      </section>
    )
  }

  return (
    <details
      className={`collapsible-section collapsible ${className}`}
      open={defaultOpen}
    >
      <summary className="collapsible-section-header">{header}</summary>
      {children}
    </details>
  )
}

export default CollapsibleSection
