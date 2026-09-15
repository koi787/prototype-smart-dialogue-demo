import { AobenMobileNav } from '../components/AobenMobileNav'
import { MobileShell } from '../components/MobileShell'
import { StructuredContentList } from '../components/StructuredContentList'
import { findMemberById } from '../data/mockMembers'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'

export function MobileMemberDialogueDetailPage({ memberId, recordId }: { memberId: string; recordId: string }) {
  const { getRecord } = useReceptionRecords()
  const member = findMemberById(memberId)
  const record = getRecord(recordId)
  const isVisible = Boolean(member && record && record.status === 'submitted' && record.customerBindingStatus === 'bound' && (record.memberId === member.id || record.customerId === member.customerId))

  if (!member || !record || !isVisible) {
    return (
      <MobileShell title="智能对话记录详情" onBack={() => navigate(member ? demoRoutes.mobileMemberDetail(member.id, 'follow-up') : demoRoutes.memberCenter)} bottomNav={<AobenMobileNav active="member" />}>
        <section className="member-center-empty"><div className="member-center-empty__icon">⊘</div><h2>记录不存在</h2><p>请返回会员详情重新选择记录。</p></section>
      </MobileShell>
    )
  }

  return (
    <MobileShell title="智能对话记录详情" onBack={() => navigate(demoRoutes.mobileMemberDetail(member.id, 'follow-up'))} bottomNav={<AobenMobileNav active="member" />}>
      <section className="mobile-dialogue-detail-heading">
        <span className="section-kicker">跟进记录 · 智能对话</span>
        <p>{record.receptionTime} · {record.method === 'face-to-face' ? '面客模式' : '事后补录'}</p>
      </section>

      <section className="info-card mobile-dialogue-info-card">
        <div className="info-card__heading"><h3>接待信息</h3></div>
        <dl className="info-grid">
          <div><dt>门店</dt><dd>{record.storeName}</dd></div>
          <div><dt>主接待人</dt><dd>{record.primaryReceptionist || record.receptionistName || '--'}</dd></div>
          <div><dt>协同接待人</dt><dd>{record.coReceptionists.length > 0 ? record.coReceptionists.join('、') : '--'}</dd></div>
          <div><dt>接待时间</dt><dd>{record.receptionTime || '--'}</dd></div>
          <div><dt>记录方式</dt><dd>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</dd></div>
        </dl>
      </section>

      <section className="mobile-dialogue-detail-section">
        <div className="mobile-member-section-heading"><h2>智能对话分析</h2></div>
        <StructuredContentList content={record.aiContent} />
      </section>
    </MobileShell>
  )
}
