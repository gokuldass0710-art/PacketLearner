import React, { useState } from 'react'
import {
  Menu,
  Search,
  Bell,
  User,
  ChevronRight,
  ShieldCheck,
  Upload,
  Info,
} from 'lucide-react'
import type { NavItemKey } from './Sidebar'

interface TopbarProps {
  currentView: NavItemKey
  onOpenMobileSidebar: () => void
  onOpenUpload: () => void
}

const viewTitles: Record<NavItemKey, { title: string; category: string }> = {
  overview: { title: 'Dashboard Overview', category: 'Monitor' },
  explorer: { title: 'Packet Explorer', category: 'Analysis' },
  capture: { title: 'Local Capture Agent', category: 'Capture' },
  analysis: { title: 'Traffic Analysis', category: 'Visualizations' },
  learning: { title: 'Beginner Learning Center', category: 'Education' },
  investigation: { title: 'Security Investigation', category: 'Threat Detection' },
  assistant: { title: 'OpenAI Assistant', category: 'Intelligence' },
  settings: { title: 'Platform Settings', category: 'Preferences' },
}

export const Topbar: React.FC<TopbarProps> = ({
  currentView,
  onOpenMobileSidebar,
  onOpenUpload,
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const current = viewTitles[currentView]

  return (
    <header className="sticky top-0 z-30 h-16 bg-cyber-surface/75 border-b border-white/10 backdrop-blur-xl px-4 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-white/5"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-cyber-muted">
          <span>PacketLearner</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-muted/60" />
          <span className="text-cyber-blue font-medium">{current.category}</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyber-muted/60" />
          <span className="text-cyber-text font-semibold">{current.title}</span>
        </div>

        <div className="sm:hidden font-semibold text-sm text-cyber-text">
          {current.title}
        </div>
      </div>

      {/* Middle: Cyber Search input */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packets, IPs, protocols (e.g. tcp.port == 80)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-black/40 border border-white/10 rounded-lg text-cyber-text placeholder:text-cyber-muted/60 focus:outline-none focus:border-cyber-blue focus:ring-1 focus:ring-cyber-blue transition-all"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-cyber-muted border border-white/10">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-3">
        {/* Quick upload trigger */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyber-neon text-cyber-bg hover:brightness-110 shadow-sm shadow-cyber-neon/30 active:scale-95 transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload PCAP</span>
        </button>

        {/* Notifications toggle */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyber-neon ring-2 ring-cyber-surface" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-cyber-surface/95 border border-white/10 shadow-2xl backdrop-blur-xl p-3 space-y-2 z-50 text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-semibold text-white">System Alerts</span>
                <span className="text-[10px] font-mono text-cyber-neon">1 New</span>
              </div>
              <div className="p-2 rounded-lg bg-white/5 space-y-1">
                <div className="flex items-center gap-1.5 font-medium text-cyber-text">
                  <Info className="w-3.5 h-3.5 text-cyber-blue" />
                  <span>Welcome to PacketLearner</span>
                </div>
                <p className="text-[11px] text-cyber-muted leading-relaxed">
                  Phase 2 UI initialized. Upload a PCAP/PCAPNG capture to explore protocols and traffic flow.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* User profile capsule */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="w-8 h-8 rounded-full bg-cyber-blue/30 border border-cyber-blue/60 flex items-center justify-center text-cyber-neon font-semibold text-xs">
            <User className="w-4 h-4 text-cyber-neon" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1">
              Analyst
              <ShieldCheck className="w-3 h-3 text-cyber-neon" />
            </div>
            <div className="text-[10px] text-cyber-muted">Beginner Level</div>
          </div>
        </div>
      </div>
    </header>
  )
}
