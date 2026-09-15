import { useMemo, useState } from 'react'
import { AdminShell } from '../components/AdminShell'
import { StructuredContentList } from '../components/StructuredContentList'
import { findMemberById } from '../data/mockMembers'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'

const memberTabs = ['基本信息', '课卡合同', '订单中心', '上课记录', '智能对话记录']

export function AdminMemberDetailPage({ memberId }: { memberId: string }) {
  const { records } = useReceptionRecords()
  const [activeTab, setActiveTab] = useState('智能对话记录')
  const [expandedRecordIds, setExpandedRecordIds] = useState<Set<string>>(new Set())
  const member = findMemberById(memberId)

  const dialogueRecords = useMemo(() => records.filter((record) => (
    record.status === 'submitted'
    && record.customerBindingStatus === 'bound'
    && (record.memberId === member?.id || record.customerId === member?.customerId)
  )), [member, records])

  if (!member) {
    return (
      <AdminShell>
        <div className="admin-breadcrumb">SCRM <span>/</span> 会员中心 <span>/</span> 会员详情</div>
        <section className="admin-empty-state admin-empty-state--page"><span>⊘</span><strong>会员不存在</strong><p>请从会员中心重新选择会员。</p><button className="admin-secondary-button" type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>返回智能对话记录</button></section>
      </AdminShell>
    )
  }

  const toggleRecord = (recordId: string) => {
    setExpandedRecordIds((current) => {
      const next = new Set(current)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  return (
    <AdminShell>
      <div className="admin-breadcrumb">SCRM <span>/</span> 会员中心 <span>/</span> 会员详情</div>
      <div className="admin-member-heading">
        <div>
          <span className="admin-page-kicker">会员中心 · 会员详情</span>
          <h1>{member.name}</h1>
          <p>用于查看会员基础信息与已关联的历史智能对话记录。</p>
        </div>
        <button className="admin-secondary-button" type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>返回智能对话记录</button>
      </div>

      <section className="member-profile-card">
        <div className="member-profile-card__avatar">{member.name.slice(0, 1)}</div>
        <div className="member-profile-card__identity"><strong>{member.name}</strong><span>{member.phone}</span><small>{member.membershipLabel}</small></div>
        <span className="admin-status-pill admin-status-pill--bound">已有会员</span>
      </section>

      <nav className="member-tabs" aria-label="会员详情页签">
        {memberTabs.map((tab) => <button key={tab} className={activeTab === tab ? 'member-tab is-active' : 'member-tab'} type="button" onClick={() => setActiveTab(tab)}>{tab}</button>)}
      </nav>

      {activeTab !== '智能对话记录' ? (
        <section className="member-placeholder-card"><span>○</span><h2>{activeTab}</h2><p>该会员详情页签仅保留现有业务概念，本 Demo 聚焦智能对话记录查看。</p></section>
      ) : (
        <section className="member-dialogue-panel">
          <div className="member-dialogue-panel__heading"><div><span className="admin-page-kicker">只读记录</span><h2>智能对话记录</h2></div><span>{dialogueRecords.length} 条已关联记录</span></div>
          <p className="member-dialogue-panel__note">仅展示关联至当前会员且状态为“已提交”的智能对话记录。</p>
          {dialogueRecords.length === 0 ? (
            <div className="member-empty-state"><strong>暂无关联记录</strong><p>未找到该会员已提交的智能对话接待记录。</p></div>
          ) : (
            <div className="member-dialogue-list">
              {dialogueRecords.map((record) => {
                const expanded = expandedRecordIds.has(record.id)
                return (
                  <article className="member-dialogue-record" key={record.id}>
                    <button className="member-dialogue-record__summary" type="button" onClick={() => toggleRecord(record.id)} aria-expanded={expanded}>
                      <span className="member-dialogue-record__date">{record.receptionTime}</span>
                      <span className="member-dialogue-record__meta">{record.storeName}｜{record.receptionistName}｜{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</span>
                      <strong>{record.aiContent.summary || '未生成一句话总结'}</strong>
                      <span className="member-dialogue-record__expand">{expanded ? '收起' : '展开'} <b>{expanded ? '⌃' : '⌄'}</b></span>
                    </button>
                    {expanded && (
                      <div className="member-dialogue-record__detail">
                        <section>
                          <div className="member-detail-section-heading"><h3>原始文字稿</h3><span>只读</span></div>
                          {record.transcript.length === 0 ? <p className="member-detail-empty">暂无可展示的原始文字稿。</p> : <div className="member-transcript-list">{record.transcript.map((line, index) => <div className="member-transcript-line" key={`${record.id}-${index}`}><time>14:30:{String(12 + index * 6).padStart(2, '0')}</time><strong className={line.speaker === '客户' ? 'is-customer' : ''}>{line.speaker}</strong><p>{line.text}</p></div>)}</div>}
                        </section>
                        <section>
                          <div className="member-detail-section-heading"><h3>最终成稿</h3><span>AI 生成 + 员工确认 · 只读</span></div>
                          <StructuredContentList content={record.aiContent} />
                        </section>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </AdminShell>
  )
}
