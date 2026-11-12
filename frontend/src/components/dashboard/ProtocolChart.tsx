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
  { name: 'TCP', value: 3420, color: '#1558C9', percentage: 48.5 },
  { name: 'TLS / HTTPS', value: 1850, color: '#06b6d4', percentage: 26.2 },
  { name: 'DNS', value: 890, color: '#D4FF24', percentage: 12.6 },
  { name: 'UDP', value: 540, color: '#a855f7', percentage: 7.7 },
  { name: 'HTTP', value: 210, color: '#10b981', percentage: 3.0 },
  { name: 'ARP & Other', value: 140, color: '#f59e0b', percentage: 2.0 },
]

const PROTOCOL_COLOR_MAP: Record<string, string> = {
  TCP: '#1558C9',
  TLS: '#06b6d4',
  HTTPS: '#06b6d4',
  'TLS / HTTPS': '#06b6d4',
  DNS: '#D4FF24',
  UDP: '#a855f7',
  HTTP: '#10b981',
  ARP: '#f59e0b',
  ICMP: '#eab308',
  DHCP: '#6366f1',
}

const FALLBACK_PALETTE = [
  '#38bdf8',
  '#f43f5e',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#84cc16',
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
    <GlassCard className="p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-cyber-neon" />
          <h3 className="text-sm font-semibold text-white">Protocol Distribution</h3>
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
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#030407" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as ProtocolData
                  return (
                    <div className="bg-cyber-surface/95 border border-white/15 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md text-xs font-mono">
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
