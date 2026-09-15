import { demoRoutes, navigate } from '../routes'

type AobenMobileNavProps = {
  active: 'home' | 'member'
}

const navItems = [
  { key: 'home' as const, label: '首页', icon: '⌂' },
  { key: 'performance' as const, label: '业绩', icon: '▥' },
  { key: 'member' as const, label: '会员', icon: '♙' },
  { key: 'mine' as const, label: '我的', icon: '◉' },
]

export function AobenMobileNav({ active }: AobenMobileNavProps) {
  return (
    <nav className="aoben-bottom-nav__items" aria-label="奥本中台底部导航">
      {navItems.map((item) => (
        <button
          className={item.key === active ? 'aoben-bottom-nav__item is-active' : 'aoben-bottom-nav__item'}
          type="button"
          key={item.key}
          onClick={() => {
            if (item.key === 'home') navigate(demoRoutes.home)
            if (item.key === 'member') navigate(demoRoutes.memberCenter)
          }}
        >
          <span aria-hidden="true">{item.icon}</span>
          <small>{item.label}</small>
        </button>
      ))}
    </nav>
  )
}
