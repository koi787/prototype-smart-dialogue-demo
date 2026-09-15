import { FormEvent, useMemo, useState } from 'react'
import { AobenMobileNav } from '../components/AobenMobileNav'
import { MobileShell } from '../components/MobileShell'
import { findMembersByPhone } from '../data/mockMembers'
import { demoRoutes, navigate } from '../routes'

export function MemberCenterPage({ initialPhone = '' }: { initialPhone?: string }) {
  const [phone, setPhone] = useState(initialPhone)
  const [searchedPhone, setSearchedPhone] = useState(initialPhone)

  const member = useMemo(() => {
    if (!searchedPhone) return undefined
    try {
      return findMembersByPhone(searchedPhone)[0]
    } catch {
      return undefined
    }
  }, [searchedPhone])

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSearchedPhone(phone.trim())
  }

  return (
    <MobileShell title="会员中心" onBack={() => navigate(demoRoutes.home)} bottomNav={<AobenMobileNav active="member" />}>
      <section className="member-center-search">
        <form className="member-search-form" onSubmit={submitSearch}>
          <span aria-hidden="true">⌕</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="numeric" placeholder="请输入手机号" aria-label="手机号" />
          <button type="submit">搜索</button>
        </form>
      </section>

      {!searchedPhone ? (
        <section className="member-center-empty">
          <div className="member-center-empty__icon">♙</div>
          <h2>查询会员</h2>
          <p>输入手机号，查询会员信息</p>
        </section>
      ) : member ? (
        <section className="member-search-result">
          <div className="member-result-heading"><h2>搜索结果</h2><span>1 位会员</span></div>
          <button className="member-result-card" type="button" onClick={() => navigate(demoRoutes.mobileMemberDetail(member.id))}>
            <span className="member-result-avatar">{member.name.slice(0, 1)}</span>
            <span className="member-result-copy"><strong>{member.name}</strong><small>{maskPhone(member.phone)}</small><em>注册时间：{member.registeredAt ?? '2026-06-22 11:04:49'}</em></span>
            <b>›</b>
          </button>
        </section>
      ) : (
        <section className="member-center-empty">
          <div className="member-center-empty__icon">⌕</div>
          <h2>未找到会员</h2>
          <p>请确认手机号后重新搜索</p>
        </section>
      )}
    </MobileShell>
  )
}

function maskPhone(phone: string) {
  return phone.length === 11 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone
}
