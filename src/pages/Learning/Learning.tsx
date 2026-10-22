import React from 'react'
import SlideLink from '@/components/SlideLink/SlideLink'
import './Learning.scss'
import { LEARNING_TITLE, LEARNING_DESCRIPTION } from './meta'
import { GUIDE_PATH } from '@/pages/Guide/meta'
import { usePageMeta } from '@/hooks/usePageMeta'
import LearningCycle from '@/components/LearningCycle/LearningCycle'
import CollapsibleSection from '@/components/CollapsibleSection/CollapsibleSection'

// 示意小卡用的圖示
function Icon({ name }: { name: string }): React.ReactElement {
  return (
    <span className="material-symbols-rounded" aria-hidden="true">
      {name}
    </span>
  )
}

// 示意小卡：一道題和兩個選項，標出這次選的答案
function JourneyQuestion({
  correct,
}: {
  correct: boolean
}): React.ReactElement {
  return (
    <>
      <span className="journey-word">apple</span>
      <span className="journey-options">
        <span className={correct ? undefined : 'wrong'}>
          {!correct && <Icon name="close" />}
          香蕉
        </span>
        <span className={correct ? 'correct' : undefined}>
          {correct && <Icon name="check" />}
          蘋果
        </span>
      </span>
    </>
  )
}

// 一道答錯的題會經歷的事，color 對應學習循環的步驟顏色
// card 是跟著同一題 apple 走完全程的示意小卡，說明文字已經講完整，所以小卡對螢幕閱讀器隱藏
const JOURNEY = [
  {
    color: 'primary',
    card: (
      <>
        <JourneyQuestion correct={false} />
        <span className="journey-caption review">
          <Icon name="replay" />
          收進錯題複習
        </span>
      </>
    ),
    when: '測驗或隨手練答錯',
    text: '測驗和隨手練都會優先出你還沒掌握的題目，偶爾穿插幾題已經會的，確認你還記得。答錯的題會自動收進錯題複習。',
  },
  {
    color: 'review',
    card: (
      <>
        <JourneyQuestion correct />
        <span className="journey-caption">答對了，今天不會再出現</span>
      </>
    ),
    when: '當天・錯題複習',
    text: '每答一題，馬上告訴你對錯和正確答案。答錯的最後再練一次，還沒答對的，下次複習再繼續練。答對的題目，今天不會再出現。',
  },
  {
    color: 'success',
    card: (
      <>
        <span className="journey-days">
          <span className="chip">
            今天
            <Icon name="check" />
          </span>
          <span className="journey-gap">
            <span>至少 8 小時</span>
          </span>
          <span className="chip">
            隔天
            <Icon name="check" />
          </span>
        </span>
        <span className="journey-result">
          兩天都答對
          <Icon name="arrow_forward" />
          <span className="journey-mastered">
            <Icon name="check" />
            掌握
          </span>
        </span>
      </>
    ),
    when: '隔天・再答對一次',
    text: '隔天再答對一次，而且距離上次答對至少 8 小時，就算掌握。熬夜到凌晨 3 點前答的，都還算前一天。',
  },
  {
    color: 'review',
    card: (
      <span className="journey-later">
        {['幾天後', '一週後', '兩週後'].map((when) => (
          <span key={when}>
            <Icon name="calendar_month" />
            <span>
              {when}
              <Icon name="check" />
            </span>
          </span>
        ))}
      </span>
    ),
    when: '幾天後、一週後、兩週後',
    text: '錯題複習會再考驗你三次，只要你還記得，就會記得更牢。忘了也沒關係，答錯的題會回到錯題複習，重新練起。',
  },
  {
    color: 'success',
    card: (
      <span className="journey-remembered">
        <span className="material-symbols-rounded fill" aria-hidden="true">
          verified
        </span>
        <span>
          <span>apple → 蘋果</span>
          <span>記牢了</span>
        </span>
      </span>
    ),
    when: '後續三次複習都答對',
    text: '之後只會在測驗裡偶爾出現。',
  },
]

// 容易白費力氣的做法，和研究建議的做法
function Pair({
  from,
  to,
  children,
}: {
  from: string
  to: string
  children: React.ReactNode
}) {
  return (
    <article className="learning-pair">
      <p className="from">
        <span className="material-symbols-rounded" aria-hidden="true">
          close
        </span>
        <span>{from}</span>
      </p>
      <p className="to">
        <span className="material-symbols-rounded" aria-hidden="true">
          check
        </span>
        <span>{to}</span>
      </p>
      <p className="why">{children}</p>
    </article>
  )
}

const TIPS = [
  ['先測一次。', '第一次練某個題庫，先做一次完整的測驗，看看自己哪裡不會。'],
  [
    '零碎時間就隨手練。',
    '下課、等車的幾分鐘，在練習頁開一次隨手練，不計時，答一題就知道對錯。',
  ],
  [
    '每天練一點。',
    '比考前一晚一次刷完有效。考前三、四週就開始，每天做一次錯題複習，記住的題目才來得及再次確認。',
  ],
  [
    '錯題多就加量。',
    '題庫很大、錯題很多時，在練習頁按錯題複習的「調整」，把每次的題數調到 20 題，才跟得上新的錯題。',
  ],
  ['卡住就先看懂。', '一直答錯的題目，先到題庫看懂再練。'],
]

// 模擬測試的結果（天數）：掌握度、測驗全部隨機、優先出還沒掌握的（每週兩次測驗、每天錯題複習）
const SIMULATION = [
  ['50%', 75, 64],
  ['80%', 155, 93],
  ['90%', 227, 102],
] as const
const SIMULATION_MAX = 227

function Bar({ kind, days }: { kind: 'random' | 'prefer'; days: number }) {
  return (
    <span className={`learning-bar ${kind}`}>
      <span
        className="learning-bar-fill"
        style={{ '--ratio': days / SIMULATION_MAX } as React.CSSProperties}
      />
      <span>約 {days} 天</span>
    </span>
  )
}

/**
 * [page] Learning page
 * 學習系統引導：先看循環與一道題的旅程，再看背後的原理、練習建議與模擬結果
 */
function Learning(): React.ReactElement {
  usePageMeta(LEARNING_TITLE, LEARNING_DESCRIPTION)

  return (
    <div className="page">
      <div className="page-container">
        <SlideLink
          direction="pop"
          className="pre-path no-style"
          to={GUIDE_PATH}
        >
          使用指南 /
        </SlideLink>
        <h1>Practions 如何幫你記住</h1>
        <p>
          讀過就忘，是大腦本來的運作方式，不是你不夠認真。Practions
          做的事很單純：在你快忘掉之前，剛好再問你一次。整個練習是一個循環：
        </p>

        <LearningCycle />

        <div className="learning">
          <section>
            <h2>一道答錯題的歷程</h2>
            <ol className="learning-timeline">
              {JOURNEY.map(({ color, card, when, text }) => (
                <li key={when} className={color}>
                  <strong>{when}</strong>
                  <div className="journey-card" aria-hidden="true">
                    {card}
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ol>
            <p className="learning-note">
              <span className="material-symbols-rounded" aria-hidden="true">
                replay
              </span>
              <span>中途哪次答錯，這題就回到錯題複習，重新練起。</span>
            </p>
            <p className="learning-note">
              <span className="material-symbols-rounded" aria-hidden="true">
                info
              </span>
              <span>
                PVQC 官方模擬跟正式考試一樣，完全隨機出題，交卷後才看成績。
              </span>
            </p>
          </section>

          <section>
            <h2>掌握度怎麼算</h2>
            <p>
              掌握度是一個題庫裡，你已經記住的題目比例。一道題要在
              <strong>不同的兩天且至少間隔 8 小時</strong>
              都答對，才算掌握，過了凌晨 3 點才算新的一天。
            </p>
            <figure className="learning-days">
              <span className="learning-days-row">
                <span className="label">一晚刷了五次</span>
                <span className="line">
                  <span className="chip">
                    同一天
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span
                        key={n}
                        className="material-symbols-rounded"
                        aria-hidden="true"
                      >
                        check
                      </span>
                    ))}
                  </span>
                  <span className="result">
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      close
                    </span>
                    還未掌握
                  </span>
                </span>
              </span>
              <span className="learning-days-row">
                <span className="label">今天和隔天都答對</span>
                <span className="timeline">
                  <span className="gap">8 小時</span>
                  <span className="track" />
                  <span className="boundary" />
                  {['今天', '隔天'].map((day, index) => (
                    <span
                      key={day}
                      className={`chip ${index ? 'end' : 'start'}`}
                    >
                      {day}
                      <span
                        className="material-symbols-rounded"
                        aria-hidden="true"
                      >
                        check
                      </span>
                    </span>
                  ))}
                  <span className="time">3:00 換日</span>
                  <span className="result done">
                    <span
                      className="material-symbols-rounded"
                      aria-hidden="true"
                    >
                      check
                    </span>
                    掌握
                  </span>
                </span>
              </span>
            </figure>
            <p>
              所以掌握度不會因為一晚刷很多次就提高，而是一天一天累積起來的。想繼續提升掌握度，就用隨手練或測驗找出還不會的題目，然後在錯題複習中持續練習。
            </p>
          </section>

          <section>
            <h2>為什麼這樣設計</h2>
            <p>三個容易白費力氣的習慣，和研究建議的做法：</p>
            <div className="learning-pairs">
              <Pair from="重讀課本" to="自己試著回想答案（也就是做測驗）">
                課本讀了好幾遍，當下覺得都會了，過幾天卻想不起來。研究發現，重讀只會讓人「覺得」記住了；真正把知識留下來的，是自己試著回想答案。測驗還能讓你知道自己哪裡不會，才知道該加強什麼。
              </Pair>
              <Pair from="答錯後只看一眼正確答案" to="馬上再答一次，直到答對">
                只看一眼，下次很容易又錯。比較好的做法是馬上知道錯在哪裡，並在同一次練習中再答一次。
              </Pair>
              <Pair from="同一個晚上反覆刷" to="隔天以後再答對一次">
                一晚刷到全部答對，多半只是短期記憶。研究發現，隔天以後再答對一次，比當下多答對好幾次更能讓記憶留得久。而且隔得越來越久，每次隔了一段時間還想得起來，就記得更牢。Practions
                是這樣安排的：
                <span className="learning-spacing" aria-hidden="true">
                  {['1 天', '幾天', '1 週', '2 週'].map((text, index) => (
                    <span className="step" key={text}>
                      {index > 0 && (
                        <span className="material-symbols-rounded">
                          arrow_forward
                        </span>
                      )}
                      <span className="chip">{text}</span>
                    </span>
                  ))}
                </span>
              </Pair>
            </div>
          </section>

          <section>
            <h2>怎麼練最有效</h2>
            <ul className="learning-tips">
              {TIPS.map(([lead, text]) => (
                <li key={lead}>
                  <span className="material-symbols-rounded" aria-hidden="true">
                    check_circle
                  </span>
                  <span>
                    <strong>{lead}</strong>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>模擬測試：這樣練要多久？</h2>
            <p>
              為了調整出題方式，Practions 模擬了一位同學從零開始練「企業資源規劃
              ERP」（690 題）：每天做一次 15 題的錯題複習，每週做兩次 50
              題的測驗。這是用簡化的假設算出來的，不是真實同學的資料，數字只能用來看趨勢。
            </p>
            <figure className="learning-chart">
              <figcaption className="learning-legend">
                <span className="random">隨機出題</span>
                <span className="prefer">優先出沒掌握的（現在的做法）</span>
              </figcaption>
              {SIMULATION.map(([mastery, random, prefer]) => (
                <span key={mastery} className="learning-chart-group">
                  <strong>掌握度 {mastery}</strong>
                  <Bar kind="random" days={random} />
                  <Bar kind="prefer" days={prefer} />
                </span>
              ))}
            </figure>
            <ul>
              <li>
                <strong>優先出還沒掌握的題目</strong>
                ，掌握度到 90% 的時間從 7 個多月縮短到 3 個多月。所以 Practions
                的測驗使用這樣的策略。
              </li>
              <li>
                <strong>練得越勤就越快。</strong>同樣的條件改成每天測驗，大約 40
                天就能到 90% 掌握度。
              </li>
              <li>
                <strong>再次複習要準時。</strong>
                錯題很多時，如果每次錯題複習只留 1/3
                的題數給要再次確認的題目，它們平均會晚 10
                天以上才出現，隔太久就容易忘；留一半，只晚 2 到 3
                天。所以每次錯題複習，最多有一半是要再次複習的題目。
              </li>
              <li>
                <strong>最後幾 % 最慢。</strong>
                已經會的題目偶爾還是會忘，這很正常，不必為了 100% 焦慮。
              </li>
            </ul>
          </section>

          <section>
            <CollapsibleSection title="參考研究">
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
                  Rohrer, D. (2006). Distributed practice in verbal recall
                  tasks: A review and quantitative synthesis.{' '}
                  <i>Psychological Bulletin</i>, 132(3), 354–380.
                </li>
                <li>
                  Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., &amp;
                  Pashler, H. (2008). Spacing effects in learning: A temporal
                  ridgeline of optimal retention. <i>Psychological Science</i>,
                  19(11), 1095–1102.
                </li>
                <li>
                  Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J.,
                  &amp; Willingham, D. T. (2013). Improving students’ learning
                  with effective learning techniques.{' '}
                  <i>Psychological Science in the Public Interest</i>, 14(1),
                  4–58.
                </li>
              </ul>
            </CollapsibleSection>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Learning
