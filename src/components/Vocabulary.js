import React, { useState, useEffect } from 'react'
import vocabulary from '../questions/vocabulary.json'
import '../styles/Vocabulary.scss'

function Vocabulary() {
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    document.title = 'PVQC題庫'
  }, [])

  const playAudio = (word) => {
    // 檢查是否有音頻正在播放
    if (window.isPlaying) {
      return
    }

    // // 優先使用內建音檔
    // if (word.audioFile) {
    //   const audio = new Audio(
    //     `${process.env.PUBLIC_URL}/vocabulary-audio/${word.audioFile}`
    //   )
    //   window.isPlaying = true
    //   audio.play()
    //   audio.onended = () => {
    //     window.isPlaying = false
    //   }
    //   return
    // }

    // 使用 Web Speech API 作為備用
    if (!speechSynthesis.speaking) {
      const utterance = new SpeechSynthesisUtterance(word.english)
      utterance.lang = 'en-US'
      window.isPlaying = true
      utterance.onend = () => {
        window.isPlaying = false
      }
      speechSynthesis.speak(utterance)
    }
  }

  const filteredWords = vocabulary.words.filter(
    (word) =>
      word.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
      word.chinese.includes(searchTerm)
  )

  return (
    <div className="vocabulary-container">
      <h1>PVQC 單字題庫</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="搜尋英文或中文..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="words-list">
        {filteredWords.map((word) => (
          <div
            key={word.id}
            className="word-item"
            onClick={() => playAudio(word)}
          >
            <div className="word-header">
              <span className="word-number">#{word.id}</span>
              <button className="play-button" onClick={() => playAudio(word)}>
                🔊
              </button>
            </div>
            <div className="word-content">
              <p className="english">{word.english}</p>
              <p className="chinese">{word.chinese}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Vocabulary
