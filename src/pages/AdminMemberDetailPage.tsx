import { useMemo, useState } from 'react'
import { AdminDialogueDetailDrawer } from './AdminDialogueDetailPage'
import { findMemberById } from '../data/mockMembers'
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

type AdminMemberDetailDrawerProps = {
  memberId: string
  onClose: () => void
}

export function AdminMemberDetailDrawer({ memberId, onClose }: AdminMemberDetailDrawerProps) {
  const { records } = useReceptionRecords()
  const [activeTab, setActiveTab] = useState<MemberTab>('dialogue')
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null)
  const member = findMemberById(memberId)

  const memberRecords = useMemo(() => records
    .filter((record) => (
      record.status === 'submitted'
      && record.customerBindingStatus === 'bound'
      && (record.memberId === member?.id || record.customerId === member?.customerId)
    ))
    .sort((left, right) => right.receptionTime.localeCompare(left.receptionTime)), [member, records])

  if (!member) {
    return (
      <div className="admin-drawer-overlay" role="presentation" onClick={onClose}>
        <aside className="admin-drawer admin-member-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="member-drawer-title" onClick={(event) => event.stopPropagation()}>
          <header className="admin-drawer__header"><h2 id="member-drawer-title">用户详情</h2><button className="admin-drawer__close" type="button" onClick={onClose} aria-label="关闭用户详情">×</button></header>
          <div className="admin-drawer__body"><div className="admin-empty-state admin-empty-state--page"><strong>用户不存在</strong></div></div>
        </aside>
      </div>
    )
  }

  return (
    <div className="admin-drawer-overlay" role="presentation" onClick={onClose}>
      <aside className="admin-drawer admin-member-detail-drawer" role="dialog" aria-modal="true" aria-labelledby="member-drawer-title" onClick={(event) => event.stopPropagation()}>
        <header className="admin-drawer__header">
          <h2 id="member-drawer-title">用户详情</h2>
          <button className="admin-drawer__close" type="button" onClick={onClose} aria-label="关闭用户详情">×</button>
        </header>

        <div className="admin-drawer__body">
          <section className="member-profile-card member-profile-card--drawer">
            <div className="member-profile-card__avatar">{member.name.slice(0, 1)}</div>
            <div className="member-profile-card__identity"><strong>{member.name}</strong><span>{member.phone}</span><small>{member.membershipLabel}</small></div>
            <span className="admin-status-pill admin-status-pill--bound">已有会员</span>
          </section>

          <nav className="member-tabs member-tabs--drawer" aria-label="用户详情页签">
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
            <DialogueTab
              records={memberRecords}
              onViewRecord={setSelectedRecordId}
            />
          ) : activeTab === 'basic' ? (
            <BasicInformation member={member} />
          ) : (
            <section className="member-placeholder-card"><span>○</span><h2>{memberTabs.find((tab) => tab.key === activeTab)?.label}</h2><p>该页面暂未开放。</p></section>
          )}
        </div>
      </aside>

      {selectedRecordId && <AdminDialogueDetailDrawer recordId={selectedRecordId} onClose={() => setSelectedRecordId(null)} />}
    </div>
  )
}

function DialogueTab({
  records,
  onViewRecord,
}: {
  records: ReturnType<typeof useReceptionRecords>['records']
  onViewRecord: (recordId: string) => void
}) {
  return (
    <>
      <section className="admin-table-panel member-dialogue-table-panel" aria-label="智能对话记录表格">
        <div className="admin-table-panel__heading"><div><h3>智能对话记录</h3><span>共 {records.length} 条记录</span></div></div>
        {records.length === 0 ? (
          <div className="admin-empty-state"><span>○</span><strong>暂无智能对话记录</strong><p>该用户当前没有符合条件的已提交记录。</p></div>
        ) : (
          <div className="admin-table-scroll">
            <table className="admin-record-table member-dialogue-table">
              <thead><tr><th>接待时间</th><th>记录方式</th><th>门店</th><th>主接待人</th><th>客户需求</th><th>意向项目</th><th>操作</th></tr></thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="admin-table-time">{record.receptionTime}</td>
                    <td>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</td>
                    <td>{record.storeName}</td>
                    <td>{record.primaryReceptionist || record.receptionistName || '--'}</td>
                    <td className="member-dialogue-table__text">{record.aiContent.customerNeeds || record.aiContent.summary || '--'}</td>
                    <td className="member-dialogue-table__text">{record.aiContent.intendedProject || '--'}</td>
                    <td><button className="admin-view-button" type="button" onClick={() => onViewRecord(record.id)}>查看详情</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="admin-pagination"><span>共 {records.length} 条</span><button type="button" disabled>上一页</button><strong>1</strong><button type="button" disabled>下一页</button></div>
      </section>
    </>
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
      <div className="member-dialogue-panel__heading"><div><h3>基础信息</h3></div></div>
      <dl className="member-basic-grid">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  )
}
