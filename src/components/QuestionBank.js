import React, { useState } from 'react'
import questions from '../questions/questions-v2.json'
import '../styles/QuestionBank.scss'

function QuestionBank() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredQuestions = questions.questions.filter((question) => {
    if (searchTerm.startsWith('#')) {
      // 如果搜尋字串以#開頭,只搜尋 question.id
      const idSearch = searchTerm.slice(1) // 移除#符號
      return question.id.toString() === idSearch
    }
    // 否則搜尋所有欄位
    return (
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.options.some((option) =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  })
  return (
    <div className="question-bank-container">
      <h1>題庫</h1>

      <div className="search-section">
        <input
          type="text"
          placeholder="搜尋題目、選項或 # 開頭搜尋題號"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      <div className="questions-list">
        {filteredQuestions.map((question) => (
          <div key={question.id} className="question-item">
            <div className="question-header">
              <span className="question-number">#{question.id}</span>
              <p className="question-text">{question.question}</p>
            </div>
            <div className="options">
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`option ${
                    idx === question.correctIndex ? 'correct-answer' : ''
                  }`}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                </div>
              ))}
            </div>
            <div className="answer-info">
              <span className="answer-label">正確答案：</span>
              <span className="answer">
                {String.fromCharCode(65 + question.correctIndex)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QuestionBank
