import { NavLink } from 'react-router-dom'
import { FileText, Users, Building2, MapPin, LayoutTemplate, Hotel, ClipboardCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/offers', label: 'Offers', icon: FileText },
  { to: '/people', label: 'People', icon: Users },
  { to: '/hotels', label: 'Hotels', icon: Hotel },
  { to: '/service-confirmations', label: 'Service Conf.', icon: ClipboardCheck },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/destinations', label: 'Destinations', icon: MapPin },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
]

export function Sidebar() {
  return (
    <aside className="w-full md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-border bg-[#faf9f7] flex flex-col md:h-screen md:sticky top-0">
      <div className="px-5 py-5 border-b border-border">
        <span className="text-xs font-bold tracking-[0.2em] text-[#b8963e] uppercase">Tours</span>
      </div>
      <nav className="flex md:flex-col gap-0.5 p-3 flex-1 overflow-x-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex shrink-0 items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-[#f5edd6] text-[#b8963e] font-medium border-l-2 border-[#b8963e] rounded-l-none pl-[10px]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
