import { NavLink } from 'react-router-dom'

interface AppHeaderProps {
  title: string
  compact?: boolean
}

export function AppHeader({ title, compact = false }: AppHeaderProps) {
  return (
    <header className={`topbar${compact ? ' topbar-compact' : ''}`}>
      <div>
        <p className="eyebrow">Sift</p>
        <h1>{title}</h1>
      </div>
      <nav className="topbar-nav" aria-label="Primary">
        <NavLink to="/" end>
          Triage
        </NavLink>
        <NavLink to="/onboarding">Profile</NavLink>
      </nav>
    </header>
  )
}
