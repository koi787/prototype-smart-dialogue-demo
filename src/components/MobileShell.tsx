import type { ReactNode } from 'react'

type MobileShellProps = {
  title: string
  onBack?: () => void
  backLabel?: string
  topbarAction?: ReactNode
  fixedFooter?: ReactNode
  bottomNav?: ReactNode
  children: ReactNode
}

export function MobileShell({ title, onBack, backLabel = '返回', topbarAction, fixedFooter, bottomNav, children }: MobileShellProps) {
  return (
    <main className="app-shell">
      <section className="mobile-frame">
        <header className="topbar">
          <div className="topbar-side topbar-side--left">
            {onBack && <button className="icon-button" type="button" onClick={onBack} aria-label={backLabel} title={backLabel}>‹</button>}
          </div>
          <h1>{title}</h1>
          <div className="topbar-side topbar-side--right">{topbarAction}</div>
        </header>

        <div className="page-content">{children}</div>
        {fixedFooter && <div className="mobile-fixed-footer">{fixedFooter}</div>}
        {bottomNav && <div className="aoben-bottom-nav">{bottomNav}</div>}
      </section>
    </main>
  )
}
