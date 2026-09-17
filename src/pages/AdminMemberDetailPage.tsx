import { useMemo, useState } from 'react'
import { AdminShell } from '../components/AdminShell'
import { AdminDialogueDetailDrawer } from './AdminDialogueDetailPage'
import { findMemberById } from '../data/mockMembers'
import { formatBindingStatus, getBindingStatus } from '../data/dialogueRecordView'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'

type MemberTab = 'basic' | 'contracts' | 'orders' | 'classes' | 'dialogue' | 'follow-up' | 'visit'

const memberTabs: Array<{ key: MemberTab; label: string; unavailable?: boolean }> = [
  { key: 'basic', label: '基础信息' },
  { key: 'contracts', label: '课卡合同' },
  { key: 'orders', label: '订单中心' },
  { key: 'classes', label: '上课记录' },
  { key: 'dialogue', label: '智能对话' },
  { key: 'follow-up', label: '跟进记录', unavailable: true },
  { key: 'visit', label: '拜访记录', unavailable: true },
]

type DialogueFilters = {
  receptionDate: 'last-30-days' | 'all'
  store: string
  receptionist: string
  method: 'all' | 'face-to-face' | 'afterwards'
}

const defaultFilters: DialogueFilters = {
  receptionDate: 'last-30-days',
  store: 'all',
  receptionist: 'all',
  method: 'all',
}

function isInLast30Days(receptionTime: string) {
  return receptionTime.slice(0, 10) >= '2026-08-19' && receptionTime.slice(0, 10) <= '2026-09-17'
}

function formatCoReceptionists(names: string[]) {
  return names.length > 0 ? names.join('、') : '--'
}

function StatusPill({ label, tone }: { label: string; tone: string }) {
  return <span className={`admin-status-pill admin-status-pill--${tone}`}>{label}</span>
}

export function AdminMemberDetailPage({ memberId }: { memberId: string }) {
  const { records } = useReceptionRecords()
  const [activeTab, setActiveTab] = useState<MemberTab>('dialogue')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const [filters, setFilters] = useState<DialogueFilters>(defaultFilters)
  const member = findMemberById(memberId)

  const memberRecords = useMemo(() => records
    .filter((record) => (
      record.status === 'submitted'
      && record.customerBindingStatus === 'bound'
      && (record.memberId === member?.id || record.customerId === member?.customerId)
    ))
    .sort((left, right) => right.receptionTime.localeCompare(left.receptionTime)), [member, records])

  const stores = useMemo(() => [...new Set(memberRecords.map((record) => record.storeName))], [memberRecords])
  const receptionists = useMemo(() => [...new Set(memberRecords.map((record) => record.primaryReceptionist || record.receptionistName))], [memberRecords])
  const visibleRecords = useMemo(() => memberRecords.filter((record) => (
    (filters.receptionDate === 'all' || isInLast30Days(record.receptionTime))
    && (filters.store === 'all' || record.storeName === filters.store)
    && (filters.receptionist === 'all' || (record.primaryReceptionist || record.receptionistName) === filters.receptionist)
    && (filters.method === 'all' || record.method === filters.method)
  )), [filters, memberRecords])

  if (!member) {
    return (
      <AdminShell>
        <div className="admin-breadcrumb">SCRM <span>/</span> 会员中心 <span>/</span> 用户详情</div>
        <section className="admin-empty-state admin-empty-state--page"><span>⊘</span><strong>用户不存在</strong><p>请从会员中心重新选择用户。</p><button className="admin-secondary-button" type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>返回智能对话记录</button></section>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="admin-breadcrumb">SCRM <span>/</span> 会员中心 <span>/</span> 用户详情</div>
      <div className="admin-member-heading">
        <div>
          <span className="admin-page-kicker">会员中心</span>
          <h1>用户详情</h1>
          <p>{member.name} · {member.phone}</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>返回智能对话记录</button>
      </div>

      <section className="member-profile-card">
        <div className="member-profile-card__avatar">{member.name.slice(0, 1)}</div>
        <div className="member-profile-card__identity"><strong>{member.name}</strong><span>{member.phone}</span><small>{member.membershipLabel}</small></div>
        <span className="admin-status-pill admin-status-pill--bound">已有会员</span>
      </section>

      <nav className="member-tabs" aria-label="用户详情页签">
        {memberTabs.map((tab) => (
          <button
            key={tab.key}
            className={activeTab === tab.key ? 'member-tab is-active' : 'member-tab'}
            type="button"
            disabled={tab.unavailable}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}{tab.unavailable && <small className="member-tab__status">未开放</small>}
          </button>
        ))}
      </nav>

      {activeTab === 'dialogue' ? (
        <>
          <section className="admin-filter-panel member-dialogue-filter-panel" aria-labelledby="member-dialogue-filter-title">
            <div className="admin-filter-panel__heading"><h2 id="member-dialogue-filter-title">筛选条件</h2></div>
            <div className="admin-filter-grid member-dialogue-filter-grid">
              <label>接待时间<select value={filters.receptionDate} onChange={(event) => setFilters((current) => ({ ...current, receptionDate: event.target.value as DialogueFilters['receptionDate'] }))}><option value="last-30-days">近30天</option><option value="all">全部时间</option></select></label>
              <label>门店<select value={filters.store} onChange={(event) => setFilters((current) => ({ ...current, store: event.target.value }))}><option value="all">全部门店</option>{stores.map((store) => <option value={store} key={store}>{store}</option>)}</select></label>
              <label>接待人<select value={filters.receptionist} onChange={(event) => setFilters((current) => ({ ...current, receptionist: event.target.value }))}><option value="all">全部接待人</option>{receptionists.map((receptionist) => <option value={receptionist} key={receptionist}>{receptionist}</option>)}</select></label>
              <label>记录方式<select value={filters.method} onChange={(event) => setFilters((current) => ({ ...current, method: event.target.value as DialogueFilters['method'] }))}><option value="all">全部方式</option><option value="face-to-face">面客模式</option><option value="afterwards">事后补录</option></select></label>
            </div>
          </section>

          <section className="admin-table-panel member-dialogue-table-panel" aria-label="智能对话记录表格">
            <div className="admin-table-panel__heading"><div><h2>智能对话记录</h2><span>共 {visibleRecords.length} 条记录</span></div></div>
            {visibleRecords.length === 0 ? (
              <div className="admin-empty-state"><span>○</span><strong>暂无智能对话记录</strong><p>该用户当前没有符合条件的已提交记录。</p></div>
            ) : (
              <div className="admin-table-scroll">
                <table className="admin-record-table member-dialogue-table">
                  <thead><tr><th>接待时间</th><th>客户姓名</th><th>客户手机号</th><th>客户关联状态</th><th>门店</th><th>主接待人</th><th>协同接待人</th><th>记录方式</th><th>操作</th></tr></thead>
                  <tbody>
                    {visibleRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="admin-table-time">{record.receptionTime}</td>
                        <td className="admin-table-strong">{record.customerInfo.name || '--'}</td>
                        <td>{record.customerInfo.phone || '--'}</td>
                        <td><StatusPill label={formatBindingStatus(getBindingStatus(record))} tone={getBindingStatus(record)} /></td>
                        <td>{record.storeName}</td>
                        <td>{record.primaryReceptionist || record.receptionistName || '--'}</td>
                        <td>{formatCoReceptionists(record.coReceptionists)}</td>
                        <td>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</td>
                        <td><button className="admin-view-button" type="button" onClick={() => setSelectedRecordId(record.id)}>查看详情</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="admin-pagination"><span>共 {visibleRecords.length} 条</span><button type="button" disabled>上一页</button><strong>1</strong><button type="button" disabled>下一页</button></div>
          </section>
        </>
      ) : activeTab === 'basic' ? (
        <BasicInformation member={member} />
      ) : (
        <section className="member-placeholder-card"><span>○</span><h2>{memberTabs.find((tab) => tab.key === activeTab)?.label}</h2><p>该页面暂未开放。</p></section>
      )}

      {selectedRecordId && <AdminDialogueDetailDrawer recordId={selectedRecordId} onClose={() => setSelectedRecordId(null)} />}
    </AdminShell>
  )
}

function BasicInformation({ member }: { member: NonNullable<ReturnType<typeof findMemberById>> }) {
  const fields = [
    ['ID', member.id],
    ['姓名', member.name],
    ['性别', member.gender ?? '--'],
    ['生日', member.birthday ?? '--'],
    ['手机号', member.phone],
    ['会员类型', member.membershipLabel],
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
    <section className="member-dialogue-panel member-basic-panel">
      <div className="member-dialogue-panel__heading"><div><h2>基础信息</h2></div></div>
      <dl className="member-basic-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  )
}
