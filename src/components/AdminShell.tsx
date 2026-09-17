import type { ReactNode } from 'react'
import { demoRoutes, navigate } from '../routes'

type AdminShellProps = {
  children: ReactNode
  activeNav?: 'dialogue' | 'members'
}

export function AdminShell({ children, activeNav = 'dialogue' }: AdminShellProps) {
  return (
    <main className="admin-shell">
      <header className="admin-product-bar">
        <div className="admin-product-bar__brand">
          <span className="admin-brand-mark">A</span>
          <div>
            <strong>AOBEN SCRM</strong>
            <span>门店业务管理平台</span>
          </div>
        </div>
        <div className="admin-product-bar__context">
          <span>智能对话接待记录</span>
          <span className="admin-readonly-badge">Demo 只读</span>
        </div>
        <button className="admin-user-button" type="button" aria-label="当前用户">
          张老师 <span aria-hidden="true">⌄</span>
        </button>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__heading">工作台</div>
          <nav aria-label="SCRM 菜单">
            <button className="admin-nav-item" type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>
              <span aria-hidden="true">▦</span> 工作台
            </button>
            <div className="admin-nav-group">
              <div className="admin-nav-group__label"><span aria-hidden="true">♧</span> 潜客管理</div>
              <button className={`admin-nav-item${activeNav === 'dialogue' ? ' admin-nav-item--active' : ''}`} type="button" onClick={() => navigate(demoRoutes.adminDialogueRecords)}>
                <span aria-hidden="true">◌</span> 智能对话记录
              </button>
            </div>
            <div className="admin-nav-group">
              <div className="admin-nav-group__label"><span aria-hidden="true">♙</span> 会员中心</div>
              <button className={`admin-nav-item${activeNav === 'members' ? ' admin-nav-item--active' : ''}`} type="button" onClick={() => navigate(demoRoutes.adminMemberList)}>
                <span aria-hidden="true">◉</span> 客户列表
              </button>
            </div>
          </nav>
          <div className="admin-sidebar__footer">当前为业务演示导航<br />不代表正式产品菜单</div>
        </aside>

        <section className="admin-main-content">{children}</section>
      </div>
    </main>
  )
}
