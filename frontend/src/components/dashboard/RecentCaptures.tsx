import React from 'react'
import { GlassCard } from '../ui/GlassCard'
import { FileText, ArrowUpRight, ShieldCheck, Clock, HardDrive, CheckCircle2 } from 'lucide-react'

export interface CaptureItem {
  id: string
  name: string
  format: 'pcap' | 'pcapng' | string
  size: string
  packets: number
  duration: string
  status: 'Analyzed' | 'Suspicious Found' | 'Clean'
  date: string
  isReal?: boolean
}

const defaultSampleCaptures: CaptureItem[] = [
  {
    id: 'cap-01',
    name: 'http_and_dns_traffic.pcap',
    format: 'pcap',
    size: '1.4 MB',
    packets: 4120,
    duration: '02m 14s',
    status: 'Clean',
    date: 'Sample Capture #1',
    isReal: false,
  },
  {
    id: 'cap-02',
    name: 'syn_port_scan_sample.pcapng',
    format: 'pcapng',
    size: '890 KB',
    packets: 2340,
    duration: '00m 45s',
    status: 'Suspicious Found',
    date: 'Sample Capture #2',
    isReal: false,
  },
  {
    id: 'cap-03',
    name: 'tls_handshake_flow.pcap',
    format: 'pcap',
    size: '2.1 MB',
    packets: 5900,
    duration: '03m 30s',
    status: 'Analyzed',
    date: 'Sample Capture #3',
    isReal: false,
  },
]

interface RecentCapturesProps {
  onSelectCapture?: (captureId: string) => void
  captures?: CaptureItem[]
  backendConnected?: boolean
}

export const RecentCaptures: React.FC<RecentCapturesProps> = ({
  onSelectCapture,
  captures,
  backendConnected = true,
}) => {
  const displayList = captures && captures.length > 0 ? captures : defaultSampleCaptures
  const hasRealCaptures = displayList.some((c) => c.isReal)

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyber-blue" />
          <h3 className="text-sm font-semibold text-white">Recent Captures</h3>
        </div>
        {hasRealCaptures ? (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-neon/15 text-cyber-neon border border-cyber-neon/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-cyber-neon" />
            Active Capture Loaded
          </span>
        ) : (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyber-muted border border-white/10">
            Sample Captures (Offline)
          </span>
        )}
      </div>

      <div className="mt-3 divide-y divide-white/5">
        {displayList.map((capture) => (
          <div
            key={capture.id}
            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors duration-200 group cursor-pointer"
            onClick={() => onSelectCapture?.(capture.id)}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg border flex-shrink-0 mt-0.5 ${
                  capture.isReal
                    ? 'bg-cyber-neon/10 border-cyber-neon/40 text-cyber-neon'
                    : 'bg-cyber-blue/10 border-cyber-blue/30 text-cyber-neon'
                }`}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-medium text-white group-hover:text-cyber-neon transition-colors">
                    {capture.name}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-cyber-muted border border-white/10 uppercase">
                    {capture.format}
                  </span>
                  {capture.isReal && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyber-neon/20 text-cyber-neon border border-cyber-neon/40">
                      LIVE TSHARK
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-cyber-muted font-mono">
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-cyber-muted" />
                    {capture.size}
                  </span>
                  <span>•</span>
                  <span>{capture.packets.toLocaleString()} pkts</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyber-muted" />
                    {capture.duration}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center w-full sm:w-auto">
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  capture.status === 'Suspicious Found'
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {capture.status}
              </span>

              <button
                className="p-1.5 rounded-md text-cyber-muted group-hover:text-cyber-neon group-hover:bg-cyber-neon/10 border border-transparent group-hover:border-cyber-neon/30 transition-colors duration-200"
                title="Inspect Capture"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-3 mt-2 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
        <span className="text-[11px] flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyber-neon" />
          Supports .pcap &amp; .pcapng files
        </span>
        <span
          className={`text-[10px] font-mono ${
            backendConnected ? 'text-cyber-neon' : 'text-amber-400'
          }`}
        >
          {backendConnected ? 'FastAPI + TShark: Ready' : 'Backend: Standby'}
        </span>
      </div>
    </GlassCard>
  )
}
