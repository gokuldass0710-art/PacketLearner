import React from 'react'
import { GlassCard } from '../ui/GlassCard'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  trend?: {
    value: string
    isPositive?: boolean
  }
  description: string
  icon: React.ComponentType<{ className?: string }>
  accent?: 'neon' | 'blue' | 'amber'
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  description,
  icon: Icon,
  accent = 'blue',
}) => {
  const accentGlow = {
    neon: 'text-cyber-neon border-cyber-neon/40 bg-cyber-neon/10',
    blue: 'text-cyber-blue border-cyber-blue/40 bg-cyber-blue/10',
    amber: 'text-cyber-neon border-cyber-neon/40 bg-cyber-neon/10',
  }

  return (
    <GlassCard className="p-4 flex flex-col justify-between hover:border-white/20 transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-medium text-cyber-muted">
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl lg:text-3xl font-semibold font-mono text-white tracking-tight">
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-cyber-muted">{unit}</span>}
          </div>
        </div>

        <div className={`p-2 rounded-md border ${accentGlow[accent]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
        <span>{description}</span>
        {trend && (
          <span
            className={`font-mono font-semibold ${trend.isPositive ? 'text-cyber-neon' : 'text-[var(--color-error)]'}`}
          >
            {trend.value}
          </span>
        )}
      </div>
    </GlassCard>
  )
}
