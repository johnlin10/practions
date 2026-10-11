import React from 'react'
import { Link } from 'react-router-dom'
import './Learning.scss'
import { LEARNING_TITLE, LEARNING_DESCRIPTION } from './meta'
import { usePageMeta } from '@/hooks/usePageMeta'

// 學習循環的四個步驟，由上往下排，最後由右側的線繞回測驗
const STEPS = [
  {
    icon: 'assignment_turned_in',
    color: 'primary',
    name: '測驗',
    text: '找出不會的',
  },
  { icon: 'replay', color: 'review', name: '錯題複習', text: '把不會的練到會' },
  {
    icon: 'event_repeat',
    color: 'review',
    name: '再次確認',
    text: '隔一段時間還記得',
  },
  {
    icon: 'trending_up',
    color: 'success',
    name: '掌握度',
    text: '看見自己的進度',
  },
]

function StepIcon({ step }: { step: number }): React.ReactElement {
  const { icon, color } = STEPS[step - 1]
  return (
    <span
      className={`learning-icon ${color} material-symbols-rounded fill`}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}

function InPractions({ children }: { children: React.ReactNode }) {
  return (
    <div className="learning-in-app">
      <strong>在 Practions 裡</strong>
      <p>{children}</p>
    </div>
  )
}

/**
 * [page] Learning page
 * 學習系統引導：測驗 → 錯題複習 → 再次確認 → 掌握度的循環，以及背後的學習原理
 */
function Learning(): React.ReactElement {
  usePageMeta(LEARNING_TITLE, LEARNING_DESCRIPTION)

  return (
    <div className="page">
      <div className="page-container">
        <h1>
          <Link className="pre-path no-style" to="/settings">
            設定 /
          </Link>{' '}
          Practions 如何幫你記住
        </h1>
        <p>
          Practions
          的練習方式，建立在學習研究反覆證實的原理上。整套系統是一個循環：
        </p>

        <div className="learning-cycle">
          <ol aria-label="學習循環，最後回到測驗">
            {STEPS.map(({ name, text }, index) => (
              <li key={name}>
                <StepIcon step={index + 1} />
                <span className="learning-step-name">{name}</span>
                <span className="learning-step-text">{text}</span>
                {index < STEPS.length - 1 && (
                  <span
                    className="learning-arrow material-symbols-rounded"
                    aria-hidden="true"
                  >
                    arrow_downward
                  </span>
                )}
              </li>
            ))}
          </ol>
          {/* 從掌握度繞回測驗的線 */}
          <span className="learning-cycle-return" aria-hidden="true">
            <span>
              <span className="material-symbols-rounded">arrow_left</span>
            </span>
          </span>
        </div>

        <div className="learning">
          <section>
            <h2>
              <StepIcon step={1} />
              一、先做測驗，找出你不會的
            </h2>
            <p>
              課本讀了好幾遍，當下覺得都會了，過幾天卻想不起來。研究發現，重讀只會讓人「覺得」記住了；真正把知識留下來的，是自己試著回想答案。所以做測驗不只是檢查讀得怎麼樣，它本身就是最有效的讀書方法之一。
            </p>
            <p>
              測驗還有另一個作用：讓你知道自己哪裡不會。沒有做過題，就不知道該加強什麼。
            </p>
            <InPractions>
              測驗頁有各科目的測驗，PVQC
              也有官方模擬和自訂測驗。測驗就像正式考試，交卷後才看到結果。你答錯的每一題，都會自動整理進錯題複習；你做過的題庫，也會開始計算掌握度。
            </InPractions>
          </section>

          <section>
            <h2>
              <StepIcon step={2} />
              二、錯題複習：當下就練到會
            </h2>
            <p>
              答錯後如果只看一眼正確答案，下次很容易又錯。比較好的做法是馬上知道錯在哪裡，並在同一次練習中再答一次，直到答對。
            </p>
            <InPractions>
              錯題複習每答一題，就會馬上告訴你對錯和正確答案。這次答錯的題目，會在最後再練一次。
            </InPractions>
          </section>

          <section>
            <h2>
              <StepIcon step={3} />
              三、隔一段時間還記得，才是真的記住
            </h2>
            <p>
              同一個晚上反覆刷，很快就能全部答對，但那多半是短期記憶。研究發現，隔天以後再答對一次，比當下多答對好幾次更能讓記憶留得久。
            </p>
            <InPractions>
              今天在錯題複習答對的題目，今天就不會再出現，你可以把時間留給其他題目。隔天或之後複習時，這題會優先出現；再答對一次，代表你真的記住了，它就會離開錯題複習。如果之後又答錯，它會回到錯題複習，重新開始。
            </InPractions>
          </section>

          <section>
            <h2>
              <StepIcon step={4} />
              四、掌握度：看見自己的進度
            </h2>
            <InPractions>
              掌握度是一個題庫裡，你已經真正記住的題目比例。一道題要在兩個不同的日子都答對，才算掌握；同一天答對好幾次，只算一次。所以掌握度不會因為一晚刷很多次就衝高，而是一天一天累積起來的。
            </InPractions>
            <p>
              掌握度還沒滿的題庫，就回到第一步，繼續做測驗，找出還不會的題目。
            </p>
          </section>

          <section>
            <h2>給你的小建議</h2>
            <ul>
              <li>
                第一次練某個題庫時，先做一次完整的測驗，看看自己哪裡不會。
              </li>
              <li>
                每天練一點，比考前一晚一次刷完有效。考前一兩週就開始，每天做一次錯題複習。
              </li>
              <li>一直答錯的題目，先到題庫看懂再練。</li>
            </ul>
          </section>

          <section>
            <h2>參考研究</h2>
            <ul className="learning-references">
              <li>
                Roediger, H. L., &amp; Karpicke, J. D. (2006). Test-enhanced
                learning: Taking memory tests improves long-term retention.{' '}
                <i>Psychological Science</i>, 17(3), 249–255.
              </li>
              <li>
                Rawson, K. A., &amp; Dunlosky, J. (2011). Optimizing schedules
                of retrieval practice for durable and efficient learning: How
                much is enough?{' '}
                <i>Journal of Experimental Psychology: General</i>, 140(3),
                283–302.
              </li>
              <li>
                Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., &amp;
                Rohrer, D. (2006). Distributed practice in verbal recall tasks:
                A review and quantitative synthesis.{' '}
                <i>Psychological Bulletin</i>, 132(3), 354–380.
              </li>
              <li>
                Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., &amp;
                Pashler, H. (2008). Spacing effects in learning: A temporal
                ridgeline of optimal retention. <i>Psychological Science</i>,
                19(11), 1095–1102.
              </li>
              <li>
                Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., &amp;
                Willingham, D. T. (2013). Improving students’ learning with
                effective learning techniques.{' '}
                <i>Psychological Science in the Public Interest</i>, 14(1),
                4–58.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Learning
