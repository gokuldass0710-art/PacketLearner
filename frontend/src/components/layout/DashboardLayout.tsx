import React, { useState } from 'react'
import { NetworkUniverse } from '../../background/NetworkUniverse'
import { Sidebar } from './Sidebar'
import type { NavItemKey } from './Sidebar'
import { Topbar } from './Topbar'

interface DashboardLayoutProps {
  children: React.ReactNode
  currentView: NavItemKey
  onSelectView: (view: NavItemKey) => void
  onOpenUpload: () => void
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentView,
  onSelectView,
  onOpenUpload,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text relative flex">
      {/* 3D Network Universe Background - Kept behind all UI */}
      <NetworkUniverse />

      {/* Main Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onSelectView={onSelectView}
        isOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 z-10 relative">
        <Topbar
          currentView={currentView}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenUpload={onOpenUpload}
        />

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
