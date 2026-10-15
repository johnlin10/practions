import React from 'react'
import './SubjectPicker.scss'

// components
import Modal from '@/components/Modal/Modal'
import { MasteryPercent } from '@/components/MasteryBar/MasteryBar'

// data
import { masteryPercent, useMastery } from '@/data/mastery'
import type { SubjectConfig } from '@/types/quiz-flows'

interface SubjectPickerProps {
  subjects: SubjectConfig[]
  // 目前的題庫；沒有時按鈕顯示「選擇題庫」
  value?: SubjectConfig
  onChange: (subject: SubjectConfig) => void
  // 清單是否開著（由使用的地方控制，例如隨手練還沒選題庫時按「開始」也會打開）
  open: boolean
  onOpenChange: (open: boolean) => void
  // 清單裡題庫名稱下方的補充，例如字數
  detail?: (subject: SubjectConfig) => string
  className?: string
}

/**
 * [component] SubjectPicker
 * 選題庫：外觀像下拉選單的按鈕，點了彈出題庫清單（隨手練、PVQC 測驗設定）。
 * 清單裡每個題庫都標出掌握度，選了就收起來。
 */
function SubjectPicker({
  subjects,
  value,
  onChange,
  open,
  onOpenChange,
  detail,
  className,
}: SubjectPickerProps): React.ReactElement {
  const mastery = useMastery()

  return (
    <>
      <button
        className={`subject-picker${className ? ` ${className}` : ''}`}
        onClick={() => onOpenChange(true)}
      >
        <span className="subject-picker-name">
          {value ? value.name : '選擇題庫'}
        </span>
        <span className="subject-picker-switch">
          {value && '切換'}
          <span className="material-symbols-rounded">expand_more</span>
        </span>
      </button>

      <Modal open={open} onClose={() => onOpenChange(false)} title="選擇題庫">
        <div className="subject-picker-list">
          {subjects.map((option) => {
            const optionMastery = mastery.get(option.id)
            const selected = option.id === value?.id
            return (
              <button
                key={option.id}
                className={selected ? 'selected' : undefined}
                aria-pressed={selected}
                onClick={() => {
                  onChange(option)
                  onOpenChange(false)
                }}
              >
                <span className="subject-picker-option">
                  {option.name}
                  {detail && <small>{detail(option)}</small>}
                </span>
                {optionMastery && (
                  <span className="subject-picker-mastery">
                    掌握度{' '}
                    <MasteryPercent percent={masteryPercent(optionMastery)} />
                  </span>
                )}
                {selected && (
                  <span className="material-symbols-rounded">check</span>
                )}
              </button>
            )
          })}
        </div>
      </Modal>
    </>
  )
}

export default SubjectPicker
