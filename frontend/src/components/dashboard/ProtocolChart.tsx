import React from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { GlassCard } from '../ui/GlassCard'
import { PieChart as PieIcon, Info, CheckCircle2 } from 'lucide-react'
import type { ProtocolCountItem } from '../../types'

interface ProtocolData {
  name: string
  value: number
  color: string
  percentage: number
}

// Illustrative sample data clearly labeled as demo
const sampleProtocolData: ProtocolData[] = [
  { name: 'TCP', value: 3420, color: 'var(--color-cyber-blue)', percentage: 48.5 },
  { name: 'TLS / HTTPS', value: 1850, color: 'var(--color-data-cyan)', percentage: 26.2 },
  { name: 'DNS', value: 890, color: 'var(--color-cyber-neon)', percentage: 12.6 },
  { name: 'UDP', value: 540, color: 'var(--color-data-blue-deep)', percentage: 7.7 },
  { name: 'HTTP', value: 210, color: 'var(--color-ok)', percentage: 3.0 },
  { name: 'ARP & Other', value: 140, color: 'var(--color-cyber-muted)', percentage: 2.0 },
]

const PROTOCOL_COLOR_MAP: Record<string, string> = {
  TCP: 'var(--color-cyber-blue)',
  TLS: 'var(--color-data-cyan)',
  HTTPS: 'var(--color-data-cyan)',
  'TLS / HTTPS': 'var(--color-data-cyan)',
  DNS: 'var(--color-cyber-neon)',
  UDP: 'var(--color-data-blue-deep)',
  HTTP: 'var(--color-ok)',
  ARP: 'var(--color-cyber-muted)',
  ICMP: 'var(--color-cyber-neon)',
  DHCP: 'var(--color-data-cyan)',
}

const FALLBACK_PALETTE = [
  'var(--color-cyber-blue)',
  'var(--color-data-cyan)',
  'var(--color-cyber-neon)',
  'var(--color-data-blue-deep)',
  'var(--color-ok)',
  'var(--color-cyber-muted)',
]

interface ProtocolChartProps {
  data?: ProtocolCountItem[]
  totalPackets?: number
  isRealData?: boolean
}

export const ProtocolChart: React.FC<ProtocolChartProps> = ({
  data,
  totalPackets,
  isRealData = false,
}) => {
  // Format real data if available, otherwise fallback to sample demo data
  const chartData: ProtocolData[] = React.useMemo(() => {
    if (data && data.length > 0) {
      return data.slice(0, 6).map((item, idx) => ({
        name: item.protocol,
        value: item.count,
        color:
          PROTOCOL_COLOR_MAP[item.protocol.toUpperCase()] ||
          FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length],
        percentage: item.percentage,
      }))
    }
    return sampleProtocolData
  }, [data])

  const displayTotal = totalPackets ?? (isRealData ? chartData.reduce((acc, d) => acc + d.value, 0) : 7050)

  return (
    <GlassCard className="p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-cyber-neon" />
          <h3 className="text-sm font-semibold text-white">Protocol distribution</h3>
        </div>
        {isRealData ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-neon/15 text-cyber-neon border border-cyber-neon/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyber-neon" />
            TShark Parsed Data
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyber-muted border border-white/10 flex items-center gap-1">
            <Info className="w-3 h-3 text-cyber-blue" />
            Demonstration Data
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-60 w-full my-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--color-bg)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ProtocolData
                  return (
                    <div className="bg-cyber-surface border border-white/15 px-3 py-2 rounded-md text-xs font-mono">
                      <div className="text-white font-bold">{item.name}</div>
                      <div className="text-cyber-muted">Packets: {item.value.toLocaleString()}</div>
                      <div className="text-cyber-neon font-semibold">{item.percentage}% of total</div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-bold font-mono text-white">
            {displayTotal.toLocaleString()}
          </span>
          <span className="text-[10px] text-cyber-muted tracking-wider uppercase">Packets</span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-white/5 text-xs">
        {chartData.map((proto) => (
          <div key={proto.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: proto.color }}
            />
            <span className="text-cyber-muted text-[11px] truncate">{proto.name}</span>
            <span className="ml-auto font-mono text-white text-[11px] font-medium">
              {proto.percentage}%
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
