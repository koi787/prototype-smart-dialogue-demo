import { demoRoutes, navigate } from '../routes'

export type DemoMode = 'mobile' | 'admin'

export function DemoTopSwitcher({ mode }: { mode: DemoMode }) {
  return (
    <header className="demo-top-switcher">
      <div className="demo-top-switcher__brand">
        <span className="brand-dot" aria-hidden="true" />
        <strong>0022 智能对话 Demo</strong>
      </div>
      <div className="demo-top-switcher__tabs" role="tablist" aria-label="Demo 演示端切换">
        <button
          className={mode === 'mobile' ? 'demo-mode-tab is-active' : 'demo-mode-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'mobile'}
          onClick={() => navigate(demoRoutes.home)}
        >
          移动端 H5
        </button>
        <button
          className={mode === 'admin' ? 'demo-mode-tab is-active' : 'demo-mode-tab'}
          type="button"
          role="tab"
          aria-selected={mode === 'admin'}
          onClick={() => navigate(demoRoutes.adminDialogueRecords)}
        >
          SCRM 后台
        </button>
      </div>
    </header>
  )
}
