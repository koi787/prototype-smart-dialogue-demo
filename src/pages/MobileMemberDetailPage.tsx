import { useMemo, useState } from 'react'
import { AobenMobileNav } from '../components/AobenMobileNav'
import { MobileShell } from '../components/MobileShell'
import { findMemberById } from '../data/mockMembers'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'

const memberTabs = ['基本信息', '跟进记录', '课卡合同', '订单中心', '上课记录', '储值合同', '其他']
const followUpTypes = ['智能对话', '跟进记录', '拜访记录']

export function MobileMemberDetailPage({ memberId, initialTab }: { memberId: string; initialTab?: 'follow-up' }) {
  const { records } = useReceptionRecords()
  const [activeTab, setActiveTab] = useState(initialTab === 'follow-up' ? '跟进记录' : '基本信息')
  const [activeFollowUpType, setActiveFollowUpType] = useState('智能对话')
  const member = findMemberById(memberId)

  const dialogueRecords = useMemo(() => records
    .filter((record) => (
      record.status === 'submitted'
      && record.customerBindingStatus === 'bound'
      && (record.memberId === member?.id || record.customerId === member?.customerId)
    ))
    .sort((left, right) => right.receptionTime.localeCompare(left.receptionTime)), [member, records])

  if (!member) {
    return (
      <MobileShell title="会员详情" onBack={() => navigate(demoRoutes.memberCenter)} bottomNav={<AobenMobileNav active="member" />}>
        <section className="member-center-empty"><div className="member-center-empty__icon">⊘</div><h2>会员不存在</h2><p>请返回会员中心重新查询。</p></section>
      </MobileShell>
    )
  }

  return (
    <MobileShell title="会员详情" onBack={() => navigate(demoRoutes.memberCenter)} bottomNav={<AobenMobileNav active="member" />}>
      <section className="mobile-member-summary">
        <span className="mobile-member-avatar">{member.name.slice(0, 1)}</span>
        <div><strong>{member.name}</strong><span>{member.phone}</span></div>
        <em>{member.membershipLabel}</em>
      </section>

      <nav className="mobile-member-tabs" aria-label="会员详情页签">
        {memberTabs.map((tab) => <button className={activeTab === tab ? 'mobile-member-tab is-active' : 'mobile-member-tab'} type="button" key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </nav>

      {activeTab === '基本信息' && <BasicInformation member={member} />}
      {activeTab === '跟进记录' && (
        <section className="mobile-follow-up-section">
          <div className="mobile-follow-up-heading"><h2>跟进记录</h2><span>只读查看</span></div>
          <div className="mobile-follow-up-types" role="tablist" aria-label="跟进记录类型">
            {followUpTypes.map((type) => <button className={activeFollowUpType === type ? 'mobile-follow-up-type is-active' : 'mobile-follow-up-type'} type="button" role="tab" aria-selected={activeFollowUpType === type} key={type} onClick={() => setActiveFollowUpType(type)}>{type}</button>)}
          </div>
          {activeFollowUpType !== '智能对话' ? <div className="mobile-member-empty"><strong>暂无记录</strong><p>当前暂无{activeFollowUpType}。</p></div> : <DialogueRecordList memberId={member.id} records={dialogueRecords} />}
        </section>
      )}
      {!['基本信息', '跟进记录'].includes(activeTab) && <section className="mobile-member-placeholder"><span>○</span><h2>{activeTab}</h2><p>该功能暂未开放。</p></section>}
    </MobileShell>
  )
}

function BasicInformation({ member }: { member: NonNullable<ReturnType<typeof findMemberById>> }) {
  const fields = [
    ['ID', member.id],
    ['姓名', member.name],
    ['性别', member.gender ?? '--'],
    ['生日', member.birthday ?? '--'],
    ['手机号', member.phone],
    ['是否新会员', member.isNewMember ?? '--'],
    ['消费等级', member.consumptionLevel ?? '--'],
    ['成长值', member.growthValue ?? '--'],
    ['结转金', member.carriedBalance ?? '--'],
    ['储值余额', member.storedBalance ?? '--'],
    ['积分', member.points ?? '--'],
    ['归属门店', member.storeName ?? '--'],
    ['用户来源', member.source ?? '--'],
    ['注册日期', member.registeredAt ?? '--'],
    ['备注', member.note ?? '--'],
  ]

  return (
    <section className="mobile-member-info-section">
      <div className="mobile-member-section-heading"><h2>基本信息</h2></div>
      <dl className="mobile-member-info-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  )
}

function DialogueRecordList({ memberId, records }: { memberId: string; records: ReturnType<typeof useReceptionRecords>['records'] }) {
  if (records.length === 0) {
    return <div className="mobile-member-empty"><strong>暂无记录</strong><p>该会员暂无已提交的智能对话记录。</p></div>
  }

  return (
    <div className="mobile-dialogue-record-list">
      {records.map((record) => (
        <article className="mobile-dialogue-record-card" key={record.id}>
          <time>{record.receptionTime}</time>
          <div className="mobile-dialogue-record-card__meta"><span>{record.storeName}</span><i>·</i><span>{record.receptionistName}</span><i>·</i><span>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</span></div>
          <p>{record.aiContent.summary}</p>
          <button type="button" onClick={() => navigate(demoRoutes.mobileMemberDialogueDetail(memberId, record.id))}>查看详情 <span>›</span></button>
        </article>
      ))}
    </div>
  )
}
