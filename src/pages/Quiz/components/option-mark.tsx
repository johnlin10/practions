/**
 * 即時回饋：已檢查時選項的樣式與右側標記，所有選擇題元件共用
 * correct 正確答案、wrong 選錯的、missed 多選題漏選的正確答案
 */
export type RevealClass = 'correct' | 'wrong' | 'missed' | ''

/** 已檢查時選項的對錯：正確答案標綠、選錯的標紅，多選題漏選的正確答案為 missed。 */
export function revealClass(
  isAnswer: boolean,
  isSelected: boolean,
  multiple = false,
): RevealClass {
  if (isAnswer && isSelected) return 'correct'
  if (isSelected) return 'wrong'
  if (isAnswer) return multiple ? 'missed' : 'correct'
  return ''
}

/** 選項右側的標記：打勾、打叉，或「漏選」。 */
export function OptionMark({ mark }: { mark: RevealClass }) {
  if (!mark) return null
  return (
    <span className="option-mark">
      {mark === 'missed' && '漏選'}
      <span className="material-symbols-rounded">
        {mark === 'wrong' ? 'close' : 'check'}
      </span>
    </span>
  )
}
