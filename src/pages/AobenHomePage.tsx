import { AobenMobileNav } from '../components/AobenMobileNav'
import { MobileShell } from '../components/MobileShell'
import { demoRoutes, navigate } from '../routes'

const tools = [
  ['扫一扫', '⌕'],
  ['开门码', '▣'],
  ['分享记录', '↗'],
  ['课时报表', '▤'],
  ['待上课程', '◷'],
  ['核销记录', '✓'],
  ['订单报表', '▥'],
  ['课时统计', '◒'],
  ['约课记录', '▦'],
  ['结转金记录', '¥'],
  ['上课记录', '♧'],
  ['客户剩余权益', '◇'],
  ['门店排课', '▦'],
  ['业绩报表', '↗'],
  ['异业消耗', '◌'],
  ['服务费', '◇'],
  ['门店对账', '▤'],
  ['联营', '♢'],
  ['加盟', '♧'],
  ['小奥同学', '☻'],
  ['系统操作手册', '?'],
  ['智能对话', '✦'],
] as const

export function AobenHomePage() {
  return (
    <MobileShell title="首页" bottomNav={<AobenMobileNav active="home" />}>
      <section className="aoben-home-context">
        <button className="aoben-store-context" type="button">
          <span>奥本瑜伽 · 国贸店</span><b>⌄</b>
        </button>
        <span>2026年09月15日 星期二</span>
      </section>

      <section className="aoben-data-cards" aria-label="今日数据">
        <article><span>今日收入</span><strong>¥12,680</strong><small>较昨日 +8.6%</small></article>
        <article><span>今日消耗</span><strong>186</strong><small>课时消耗</small></article>
        <article><span>今日上课</span><strong>24</strong><small>节课程</small></article>
      </section>

      <section className="aoben-home-section">
        <div className="aoben-section-heading"><h2>今日课程</h2><button type="button">全部 <span>›</span></button></div>
        <div className="aoben-class-list">
          <article className="aoben-class-card"><time>10:00</time><div><strong>瑜伽基础</strong><span>张老师 · 12人已约</span></div><em>进行中</em></article>
          <article className="aoben-class-card"><time>14:30</time><div><strong>体态改善小班</strong><span>王老师 · 8人已约</span></div><em className="is-later">待上课</em></article>
        </div>
      </section>

      <section className="aoben-home-section aoben-tools-section">
        <div className="aoben-section-heading"><h2>全部工具</h2></div>
        <div className="aoben-tool-grid">
          {tools.map(([label, icon]) => (
            <button className={label === '智能对话' ? 'aoben-tool-item is-dialogue' : 'aoben-tool-item'} type="button" key={label} onClick={() => label === '智能对话' && navigate(demoRoutes.records)}>
              <span>{icon}</span><small>{label}</small>
            </button>
          ))}
        </div>
      </section>
    </MobileShell>
  )
}
