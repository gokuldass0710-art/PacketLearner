import React from 'react'
import type { ProtocolType, SeverityLevel } from '../../types'

interface ProtocolBadgeProps {
  protocol: ProtocolType
  className?: string
}

export const ProtocolBadge: React.FC<ProtocolBadgeProps> = ({ protocol, className = '' }) => {
  const protocolColors: Record<ProtocolType, string> = {
    TCP: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    UDP: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    DNS: 'bg-lime-400/20 text-cyber-neon border-lime-400/40',
    HTTP: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    HTTPS: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    TLS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    ICMP: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    ARP: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
    DHCP: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    OTHER: 'bg-white/10 text-cyber-muted border-white/20',
  }

  const colorClass = protocolColors[protocol] || protocolColors.OTHER

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colorClass} ${className}`}
    >
      {protocol}
    </span>
  )
}

interface SeverityBadgeProps {
  severity: SeverityLevel
  className?: string
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className = '' }) => {
  const severityStyles: Record<SeverityLevel, { label: string; class: string }> = {
    critical: {
      label: 'CRITICAL',
      class: 'bg-red-500/20 text-red-400 border-red-500/50 shadow-sm shadow-red-500/20',
    },
    high: {
      label: 'HIGH',
      class: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    },
    medium: {
      label: 'MEDIUM',
      class: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    low: {
      label: 'LOW',
      class: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    },
    info: {
      label: 'INFO',
      class: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    },
  }

  const item = severityStyles[severity]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${item.class} ${className}`}
    >
      {item.label}
    </span>
  )
}
