import React from 'react'
import './QuestionImage.scss'

// 題目附圖放在 src/data/images/，由 Vite 打包進 /assets/，離線快取會一起帶走。
// 題庫只存檔名，顯示時才換成網址，換圖後舊紀錄的題目快照也找得到新圖。
const urls = import.meta.glob<string>('../../data/images/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
})
const imageUrl = (name: string): string | undefined =>
  urls[`../../data/images/${name}`]

/**
 * [component] QuestionImages component
 * 題目的附圖（截圖、表格），放在題目文字下方
 */
export function QuestionImages({
  images,
}: {
  images?: string[]
}): React.ReactElement | null {
  if (!images?.length) return null
  return (
    <div className="question-images">
      {images.map((name) => (
        <img
          key={name}
          src={imageUrl(name)}
          alt="題目附圖"
          // 作答畫面用原圖尺寸算圖片最小可以縮到多高（quiz-global.scss）
          onLoad={({ currentTarget: img }) => {
            img.style.setProperty('--w', String(img.naturalWidth))
            img.style.setProperty('--h', String(img.naturalHeight))
          }}
        />
      ))}
    </div>
  )
}

/**
 * [component] OptionImage component
 * 選項的圖示，放在選項文字前面
 */
export function OptionImage({
  name,
}: {
  name?: string
}): React.ReactElement | null {
  if (!name) return null
  return <img className="option-image" src={imageUrl(name)} alt="選項圖示" />
}
