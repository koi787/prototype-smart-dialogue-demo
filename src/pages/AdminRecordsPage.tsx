import { MobileShell } from '../components/MobileShell'
import { StatusTag } from '../components/StatusTag'
import { demoRoutes, navigate } from '../routes'
import { useReceptionRecords } from '../store/ReceptionRecordsContext'

export function AdminRecordsPage() {
  const { records } = useReceptionRecords()
  const submittedRecords = records.filter((record) => record.status === 'submitted')

  return (
    <MobileShell title="后台查看">
      <div className="page-intro admin-page-intro">
        <div>
          <span className="section-kicker">管理人员查看</span>
          <h2>已提交接待记录</h2>
        </div>
        <span className="admin-readonly-badge">只读</span>
      </div>

      <aside className="admin-boundary-note">
        <span>▣</span>
        <p>这里只查看员工已确认提交的记录，不包含草稿、编辑或客户管理能力。</p>
      </aside>

      <div className="admin-record-list">
        {submittedRecords.length === 0 ? (
          <section className="empty-state">
            <span className="empty-state__icon">○</span>
            <h3>暂无已提交记录</h3>
            <p>员工确认提交后，记录会显示在这里。</p>
          </section>
        ) : (
          submittedRecords.map((record) => (
            <button className="admin-record-card" type="button" key={record.id} onClick={() => navigate(demoRoutes.adminDetail(record.id))}>
              <div className="admin-record-card__topline">
                <strong>{record.customerInfo.name || '未填写姓名'}</strong>
                <StatusTag status={record.status} />
              </div>
              <p className="admin-record-card__time">{record.receptionTime}</p>
              <dl className="admin-record-card__fields">
                <div><dt>门店</dt><dd>{record.storeName}</dd></div>
                <div><dt>接待人</dt><dd>{record.receptionistName}</dd></div>
                <div><dt>记录方式</dt><dd>{record.method === 'face-to-face' ? '面客模式' : '事后补录'}</dd></div>
              </dl>
              <span className="admin-record-card__arrow">查看详情 ›</span>
            </button>
          ))
        )}
      </div>

      <button className="secondary-button" type="button" onClick={() => navigate(demoRoutes.records)}>返回员工端列表</button>
    </MobileShell>
  )
}
