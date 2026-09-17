import { useMemo, useState } from 'react'
import { AdminShell } from '../components/AdminShell'
import { AdminMemberDetailDrawer } from './AdminMemberDetailPage'
import { mockMembers } from '../data/mockMembers'

export function AdminCustomerListPage({ initialMemberId }: { initialMemberId?: string } = {}) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId ?? null)
  const members = useMemo(() => mockMembers, [])

  return (
    <AdminShell activeNav="members">
      <div className="admin-breadcrumb">SCRM <span>/</span> 会员中心 <span>/</span> 客户列表</div>
      <div className="admin-page-header">
        <div>
          <span className="admin-page-kicker">会员中心</span>
          <h1>客户列表</h1>
          <p>查看客户基础信息及已关联的智能对话记录。</p>
        </div>
      </div>

      <section className="admin-table-panel customer-list-panel" aria-label="客户列表">
        <div className="admin-table-panel__heading"><div><h2>客户列表</h2><span>共 {members.length} 位客户</span></div></div>
        <div className="admin-table-scroll">
          <table className="admin-record-table customer-table">
            <thead><tr><th>ID</th><th>头像</th><th>姓名</th><th>手机号</th><th>用户来源</th><th>会员等级</th><th>操作</th></tr></thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td className="admin-table-time">{member.id}</td>
                  <td><span className="customer-table__avatar">{member.name.slice(0, 1)}</span></td>
                  <td className="admin-table-strong">{member.name}</td>
                  <td>{member.phone}</td>
                  <td>{member.source ?? '--'}</td>
                  <td>{member.membershipLabel}</td>
                  <td><button className="admin-view-button" type="button" onClick={() => setSelectedMemberId(member.id)}>查看详情</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination"><span>共 {members.length} 位客户</span><button type="button" disabled>上一页</button><strong>1</strong><button type="button" disabled>下一页</button></div>
      </section>

      {selectedMemberId && <AdminMemberDetailDrawer memberId={selectedMemberId} onClose={() => setSelectedMemberId(null)} />}
    </AdminShell>
  )
}
