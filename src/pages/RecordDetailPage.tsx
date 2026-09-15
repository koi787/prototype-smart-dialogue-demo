import { MobileShell } from '../components/MobileShell'
import { StatusTag } from '../components/StatusTag'
import { StructuredContentList } from '../components/StructuredContentList'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'
import { findMemberById } from '../data/mockMembers'

export function RecordDetailPage({ recordId, admin = false }: { recordId: string; admin?: boolean }) {
  const { getRecord } = useReceptionRecords()
  const record = getRecord(recordId)
  const associatedMember = findMemberById(record?.memberId, record?.customerId)

  if (!record) {
    return (
      <MobileShell title={admin ? '后台记录详情' : '记录详情'} onBack={() => navigate(admin ? demoRoutes.adminRecords : demoRoutes.records)}>
        <section className="empty-state">
          <h2>记录不存在</h2>
          <p>请返回列表重新选择一条记录。</p>
        </section>
      </MobileShell>
    )
  }

  if (admin && record.status !== 'submitted') {
    return (
      <MobileShell title="后台记录详情" onBack={() => navigate(demoRoutes.adminRecords)}>
        <section className="empty-state">
          <span className="empty-state__icon">⊘</span>
          <h2>无法查看草稿</h2>
          <p>后台仅支持查看员工已提交的接待记录。</p>
        </section>
      </MobileShell>
    )
  }

  return (
    <MobileShell title={admin ? '后台记录详情' : '接待记录详情'} onBack={() => navigate(admin ? demoRoutes.adminRecords : demoRoutes.records)}>
      <div className="detail-status-row">
        <span className="section-kicker">接待记录</span>
        <StatusTag status={record.status} />
      </div>

      <section className="detail-hero">
        <h2>{record.title}</h2>
        <p>
          {record.status === 'submitted'
            ? '已由员工确认并沉淀为接待记录'
            : '已保存为草稿，可在后续确认流程中继续编辑'}
        </p>
      </section>

      <section className="info-card">
        <div className="info-card__heading">
          <h3>接待基础信息</h3>
          <span>上下文</span>
        </div>
        <dl className="info-grid">
          <div><dt>门店</dt><dd>{record.storeName}</dd></div>
          <div><dt>接待人</dt><dd>{record.receptionistName}</dd></div>
          <div><dt>接待时间</dt><dd>{record.receptionTime}</dd></div>
          <div><dt>记录方式</dt><dd>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</dd></div>
        </dl>
      </section>

      <section className="info-card">
        <div className="info-card__heading">
          <h3>客户信息</h3>
          <span>选填</span>
        </div>
        <dl className="info-grid info-grid--customer">
          <div><dt>姓名</dt><dd>{record.customerInfo.name || '未填写'}</dd></div>
          <div><dt>手机号</dt><dd>{record.customerInfo.phone || '未填写'}</dd></div>
          <div><dt>客户关联状态</dt><dd>{record.customerBindingStatus === 'bound' ? '已关联' : '未关联'}</dd></div>
          {associatedMember && <div><dt>会员姓名</dt><dd>{associatedMember.name}</dd></div>}
        </dl>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">AI 整理结果</span>
            <h2>完整记录内容</h2>
          </div>
          <span className="content-count">8 项</span>
        </div>
        <StructuredContentList content={record.aiContent} />
      </section>

      <button className="secondary-button" type="button" onClick={() => navigate(admin ? demoRoutes.adminRecords : demoRoutes.records)}>
        返回列表
      </button>
    </MobileShell>
  )
}
