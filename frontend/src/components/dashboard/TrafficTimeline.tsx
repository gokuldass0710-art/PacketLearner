import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { GlassCard } from '../ui/GlassCard'
import { Activity, Clock, CheckCircle2 } from 'lucide-react'
import type { Packet } from '../../types'

interface TimelinePoint {
  time: string
  packets: number
  bytesKb: number
}

// Illustrative timeline data representing packet rate variation over a 60s sample capture
const sampleTimelineData: TimelinePoint[] = [
  { time: '00:00', packets: 45, bytesKb: 38 },
  { time: '00:05', packets: 80, bytesKb: 72 },
  { time: '00:10', packets: 120, bytesKb: 110 },
  { time: '00:15', packets: 340, bytesKb: 410 },
  { time: '00:20', packets: 290, bytesKb: 320 },
  { time: '00:25', packets: 95, bytesKb: 85 },
  { time: '00:30', packets: 60, bytesKb: 50 },
  { time: '00:35', packets: 420, bytesKb: 480 },
  { time: '00:40', packets: 380, bytesKb: 430 },
  { time: '00:45', packets: 110, bytesKb: 95 },
  { time: '00:50', packets: 75, bytesKb: 65 },
  { time: '00:55', packets: 90, bytesKb: 80 },
  { time: '01:00', packets: 50, bytesKb: 42 },
]

interface TrafficTimelineProps {
  packets?: Packet[]
  durationSeconds?: number
  isRealData?: boolean
}

export const TrafficTimeline: React.FC<TrafficTimelineProps> = ({
  packets,
  durationSeconds = 60,
  isRealData = false,
}) => {
  const chartData: TimelinePoint[] = React.useMemo(() => {
    if (!isRealData || !packets || packets.length === 0) {
      return sampleTimelineData
    }

    const maxTime = Math.max(durationSeconds, 1)
    const bucketCount = 12
    const bucketSize = maxTime / bucketCount

    const buckets: { packets: number; bytes: number }[] = Array.from(
      { length: bucketCount },
      () => ({ packets: 0, bytes: 0 })
    )

    packets.forEach((p) => {
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor(p.timestamp / bucketSize))
      )
      buckets[idx].packets += 1
      buckets[idx].bytes += p.length
    })

    return buckets.map((b, i) => {
      const sec = Math.round(i * bucketSize)
      const mm = String(Math.floor(sec / 60)).padStart(2, '0')
      const ss = String(sec % 60).padStart(2, '0')
      return {
        time: `${mm}:${ss}`,
        packets: b.packets,
        bytesKb: Math.round(b.bytes / 1024),
      }
    })
  }, [packets, durationSeconds, isRealData])

  const peakPackets = Math.max(...chartData.map((d) => d.packets), 0)

  return (
    <GlassCard className="p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-blue" />
          <div>
            <h3 className="text-sm font-semibold text-white">Network activity timeline</h3>
            <p className="text-[11px] text-cyber-muted">Packet volume and throughput distribution</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRealData ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-neon/10 text-cyber-neon border border-cyber-neon/40 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-cyber-neon" />
              {Math.round(durationSeconds)}s Capture
            </span>
          ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-transparent text-cyber-muted border border-white/10 flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyber-neon" />
              60s Sample Window
            </span>
          )}
        </div>
      </div>

      {/* Area Chart */}
      <div className="h-64 w-full my-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="packetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cyber-blue)" stopOpacity={0.22} />
                <stop offset="95%" stopColor="var(--color-cyber-blue)" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bytesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-cyber-neon)" stopOpacity={0.16} />
                <stop offset="95%" stopColor="var(--color-cyber-neon)" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-rule)" vertical={false} />

            <XAxis
              dataKey="time"
              stroke="var(--color-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-rule-strong)' }}
            />
            <YAxis
              stroke="var(--color-muted)"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-rule-strong)' }}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-cyber-surface border border-white/15 px-3 py-2 rounded-md text-xs font-mono space-y-1">
                      <div className="text-cyber-muted border-b border-white/10 pb-1">
                        Time: {label}
                      </div>
                      <div className="text-white flex items-center justify-between gap-4">
                        <span className="text-cyber-blue font-semibold">Packets:</span>
                        <span>{payload[0].value}</span>
                      </div>
                      <div className="text-white flex items-center justify-between gap-4">
                        <span className="text-cyber-neon font-semibold">Volume:</span>
                        <span>{payload[1]?.value} KB</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />

            <Area
              type="monotone"
              dataKey="packets"
              stroke="var(--color-cyber-blue)"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#packetGradient)"
            />
            <Area
              type="monotone"
              dataKey="bytesKb"
              stroke="var(--color-cyber-neon)"
              strokeWidth={1.5}
              fillOpacity={1}
              fill="url(#bytesGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyber-blue" />
            <span className="text-[11px]">Packet Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyber-neon" />
            <span className="text-[11px]">Throughput (KB)</span>
          </div>
        </div>
        <span className="text-[10px] font-mono text-cyber-neon">
          Peak: {peakPackets.toLocaleString()} pkts/interval
        </span>
      </div>
    </GlassCard>
  )
}
