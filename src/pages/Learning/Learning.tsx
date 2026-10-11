import React from 'react'
import { Link } from 'react-router-dom'
import './Learning.scss'
import { LEARNING_TITLE, LEARNING_DESCRIPTION } from './meta'
import { usePageMeta } from '@/hooks/usePageMeta'
import LearningCycle, {
  StepIcon,
} from '@/components/LearningCycle/LearningCycle'

// 模擬測試的結果：掌握度、測驗全部隨機、優先出還沒掌握的（每週兩次測驗、每天錯題複習）
const SIMULATION = [
  ['50%', '約 75 天', '約 64 天'],
  ['80%', '約 155 天', '約 93 天'],
  ['90%', '約 227 天', '約 102 天'],
]

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

        <LearningCycle />

        <div className="learning">
          <section>
            <h2>
              <StepIcon step={1} />
              先做測驗，找出你不會的
            </h2>
            <p>
              課本讀了好幾遍，當下覺得都會了，過幾天卻想不起來。研究發現，重讀只會讓人「覺得」記住了；真正把知識留下來的，是自己試著回想答案。所以做測驗不只是檢查讀得怎麼樣，它本身就是最有效的讀書方法之一。
            </p>
            <p>
              測驗還有另一個作用：讓你知道自己哪裡不會。沒有做過題，就不知道該加強什麼。
            </p>
            <InPractions>
              測驗頁有各科目的測驗，PVQC
              也有官方模擬和自訂測驗。測驗就像正式考試，交卷後才看到結果。你答錯的每一題，都會自動整理進錯題複習；你做過的題庫，也會開始計算掌握度。測驗會優先出你還沒掌握的題目，也會穿插幾題已經會的，確認你沒有忘記；PVQC
              官方模擬則跟正式考試一樣，完全隨機出題。
            </InPractions>
          </section>

          <section>
            <h2>
              <StepIcon step={2} />
              錯題複習：當下就練到會
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
              隔一段時間還記得，才是真的記住
            </h2>
            <p>
              同一個晚上反覆刷，很快就能全部答對，但那多半是短期記憶。研究發現，隔天以後再答對一次，比當下多答對好幾次更能讓記憶留得久。
            </p>
            <p>
              而且可以隔得越來越久：剛學會時隔一天，之後隔幾天、一週、兩週再想一次。每次隔了一段時間還想得起來，就記得更牢。
            </p>
            <InPractions>
              今天在錯題複習答對的題目，今天就不會再出現，你可以把時間留給其他題目。隔天再答對一次，代表你記住了，它就不再是錯題。不過記住的題目，之後還會在錯題複習裡再出現三次：幾天後、一週後、兩週後，再次確認你還記得。三次都答對，之後就只會在測驗裡偶爾遇到；哪次答錯了，它會變回錯題，重新練起。
            </InPractions>
          </section>

          <section>
            <h2>
              <StepIcon step={4} />
              掌握度：看見自己的進度
            </h2>
            <InPractions>
              掌握度是一個題庫裡，你已經真正記住的題目比例。一道題要在兩個不同的日子都答對，才算掌握；同一天答對好幾次，只算一次。所以掌握度不會因為一晚刷很多次就衝高，而是一天一天累積起來的。
            </InPractions>
            <p>
              掌握度還沒滿的題庫，就回到第一步，繼續做測驗，找出還不會的題目。
            </p>
          </section>

          <section>
            <h2>模擬測試：這樣練要多久？</h2>
            <p>
              為了調整出題方式，我們用電腦模擬一位同學從零開始練「企業資源規劃
              ERP」（690 題）：每天做一次 15 題的錯題複習，每週做兩次 50
              題的測驗。模擬的同學會越練越熟，也會忘記；不過這是用簡化的假設算出來的，不是真實同學的資料，數字只能看出趨勢。
            </p>
            <table className="learning-table">
              <thead>
                <tr>
                  <th>掌握度</th>
                  <th>隨機出題</th>
                  <th>優先出沒掌握的</th>
                </tr>
              </thead>
              <tbody>
                {SIMULATION.map(([mastery, random, prefer]) => (
                  <tr key={mastery}>
                    <td>{mastery}</td>
                    <td>{random}</td>
                    <td>{prefer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul>
              <li>
                <strong>優先出還沒掌握的題目</strong>
                ，掌握度到 90% 的時間從 7 個多月縮短到 3 個多月。所以 Practions
                的測驗會這樣出題。
              </li>
              <li>
                <strong>練得越勤越快。</strong>同樣的條件改成每天測驗，大約 40
                天就能到 90%。
              </li>
              <li>
                <strong>再次確認要準時。</strong>
                錯題很多時，如果每次錯題複習只留 1/3
                的題數給要再次確認的題目，它們平均會晚 10
                天以上才出現，隔太久就容易忘；留一半，只晚 2 到 3
                天。所以每次錯題複習，最多有一半是要再次確認的題目。
              </li>
              <li>
                <strong>最後幾 % 最慢。</strong>
                已經會的題目偶爾還是會忘，這很正常，不必為了 100% 焦慮。
              </li>
            </ul>
          </section>

          <section>
            <h2>給你的小建議</h2>
            <ul>
              <li>
                第一次練某個題庫時，先做一次完整的測驗，看看自己哪裡不會。
              </li>
              <li>
                每天練一點，比考前一晚一次刷完有效。考前三、四週就開始，每天做一次錯題複習，記住的題目才來得及再次確認。
              </li>
              <li>
                題庫很大、錯題很多時，把每次複習的題數調到 20
                題，複習才跟得上新增的錯題。
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
