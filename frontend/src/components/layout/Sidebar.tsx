import React from 'react'
import {
  LayoutDashboard,
  SearchCode,
  Activity,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Settings,
  Shield,
  Radio,
  X,
} from 'lucide-react'

export type NavItemKey =
  | 'overview'
  | 'explorer'
  | 'analysis'
  | 'learning'
  | 'investigation'
  | 'assistant'
  | 'settings'

interface SidebarProps {
  currentView: NavItemKey
  onSelectView: (view: NavItemKey) => void
  isOpen: boolean
  onCloseMobile: () => void
}

interface MenuItem {
  key: NavItemKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const menuItems: MenuItem[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'explorer', label: 'Packet Explorer', icon: SearchCode },
  { key: 'analysis', label: 'Traffic Analysis', icon: Activity },
  { key: 'learning', label: 'Learning Center', icon: GraduationCap, badge: 'Beginner' },
  { key: 'investigation', label: 'Security Investigation', icon: ShieldAlert },
  { key: 'assistant', label: 'OpenAI Assistant', icon: Sparkles, badge: 'AI' },
  { key: 'settings', label: 'Settings', icon: Settings },
]

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  isOpen,
  onCloseMobile,
}) => {
  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-cyber-surface/95 border-r border-white/10 backdrop-blur-xl flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyber-blue/20 border border-cyber-blue/40 flex items-center justify-center text-cyber-neon shadow-sm shadow-cyber-blue/40">
              <Shield className="w-5 h-5 text-cyber-neon" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                PacketLearner
                <span className="text-[10px] px-1.5 py-0.2 font-mono font-normal rounded bg-cyber-blue/30 text-cyber-neon border border-cyber-neon/30">
                  v0.1
                </span>
              </div>
              <p className="text-[11px] text-cyber-muted truncate max-w-[130px]">
                Learn the Traffic
              </p>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-cyber-muted hover:text-white hover:bg-white/5"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentView === item.key

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelectView(item.key)
                  onCloseMobile()
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-cyber-blue/20 text-white border border-cyber-blue/50 shadow-sm shadow-cyber-blue/20'
                    : 'text-cyber-muted hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-cyber-neon' : 'text-cyber-muted group-hover:text-cyber-neon'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      item.badge === 'AI'
                        ? 'bg-cyber-neon/15 text-cyber-neon border-cyber-neon/30'
                        : 'bg-cyber-blue/20 text-cyber-blue border-cyber-blue/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Live Capture Agent Status Card (Reserved for Phase 7) */}
        <div className="p-3 border-t border-white/10">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyber-text flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyber-muted" />
                Capture Agent
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                Phase 7
              </span>
            </div>
            <p className="text-[11px] text-cyber-muted leading-relaxed">
              Local TShark daemon is not running. PCAP uploads active.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
