/**
 * PacketIntelPanel — Detailed field-by-field packet breakdown.
 * Shows all decoded fields with beginner-friendly explanations.
 * Includes Beginner Explanation Engine output.
 */

import { X, Shield, ShieldAlert, Info, AlertCircle, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import { GlassCard } from '../ui/GlassCard'
import { ProtocolBadge } from '../ui/Badge'
import { explainPacket } from '../../utils/packetExplainer'
import type { Packet } from '../../types'

interface PacketIntelPanelProps {
  packet: Packet
  onClose: () => void
}

const FieldRow: React.FC<{ label: string; value: React.ReactNode; note?: string; highlight?: boolean }> = ({
  label,
  value,
  note,
  highlight = false,
}) => (
  <div className={`flex items-start justify-between gap-3 py-2 border-b border-white/5 last:border-0 ${highlight ? 'bg-cyber-neon/5 -mx-4 px-4 rounded' : ''}`}>
    <div className="min-w-0 flex-1">
      <span className="text-[11px] text-cyber-muted font-mono block">{label}</span>
      {note && <span className="text-[10px] text-cyber-muted/70 leading-tight block mt-0.5">{note}</span>}
    </div>
    <div className="flex-shrink-0 text-right">
      <span className="text-xs text-cyber-text font-mono">{value}</span>
    </div>
  </div>
)

const SuspicionBanner: React.FC<{ level: string; reason?: string }> = ({ level, reason }) => {
  if (level === 'normal') {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-400/30">
        <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <div>
          <span className="text-xs font-semibold text-emerald-400">Normal Traffic</span>
          <p className="text-[11px] text-cyber-muted mt-0.5">No suspicious indicators detected in this packet.</p>
        </div>
      </div>
    )
  }

  const styles = {
    low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-400/30', label: 'Low Concern' },
    medium: { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-400/30', label: 'Medium Concern' },
    high: { icon: ShieldAlert, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-400/30', label: 'High Concern' },
  }[level as 'low' | 'medium' | 'high'] ?? { icon: Info, color: 'text-cyber-muted', bg: 'bg-white/5', border: 'border-white/10', label: 'Unknown' }

  const Icon = styles.icon

  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg ${styles.bg} border ${styles.border}`}>
      <Icon className={`w-4 h-4 ${styles.color} flex-shrink-0 mt-0.5`} />
      <div>
        <span className={`text-xs font-semibold ${styles.color}`}>{styles.label}</span>
        {reason && <p className="text-[11px] text-cyber-muted mt-0.5 leading-relaxed">{reason}</p>}
      </div>
    </div>
  )
}

export const PacketIntelPanel: React.FC<PacketIntelPanelProps> = ({ packet, onClose }) => {
  const explanation = explainPacket(packet)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <GlassCard variant="accent-blue" className="h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-cyber-surface/95 backdrop-blur-md flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Zap className="w-4 h-4 text-cyber-neon flex-shrink-0" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{explanation.headline}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ProtocolBadge protocol={packet.protocol} />
                <span className="text-[10px] font-mono text-cyber-muted">Frame #{packet.id}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 text-cyber-muted hover:text-white transition-colors"
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* What is this packet */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">What is this packet?</h4>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.whatIsThisPacket}</p>
          </div>

          {/* Purpose + importance */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Purpose</h4>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.purpose}</p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white">Why it matters</h4>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.whyImportant}</p>
          </div>

          {/* Suspicion banner */}
          <SuspicionBanner level={explanation.suspicionLevel} reason={explanation.suspicionReason} />

          {/* TCP Flags */}
          {explanation.tcpFlagsMeaning && (
            <div className="p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
              <span className="text-[11px] font-semibold text-cyber-blue block mb-1">TCP Flags Active:</span>
              <span className="text-xs text-cyber-text leading-relaxed">{explanation.tcpFlagsMeaning}</span>
            </div>
          )}

          {/* Packet Fields */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-3">Packet Fields</h4>
            <div className="rounded-lg bg-black/40 border border-white/10 p-4 space-y-0">
              <FieldRow
                label="Frame Number"
                value={`#${packet.id}`}
                note="Unique packet index in this capture"
              />
              <FieldRow
                label="Timestamp"
                value={packet.formattedTime}
                note="Relative time from capture start"
              />
              <FieldRow
                label="Source IP"
                value={packet.sourceIp}
                note="Sending device's IP address (Layer 3)"
                highlight
              />
              {packet.sourcePort && (
                <FieldRow
                  label="Source Port"
                  value={packet.sourcePort}
                  note="Sending application's port (Layer 4)"
                />
              )}
              <FieldRow
                label="Destination IP"
                value={packet.destinationIp}
                note="Receiving device's IP address (Layer 3)"
                highlight
              />
              {packet.destinationPort && (
                <FieldRow
                  label="Destination Port"
                  value={packet.destinationPort}
                  note="Target application's port (Layer 4)"
                />
              )}
              <FieldRow
                label="Protocol"
                value={<ProtocolBadge protocol={packet.protocol} />}
                note="Highest-layer protocol identified"
              />
              <FieldRow
                label="Length"
                value={`${packet.length} bytes`}
                note="Total captured packet size"
              />
              {packet.tcpFlags && (
                <FieldRow
                  label="TCP Flags"
                  value={
                    <span className="font-mono text-cyber-neon text-[11px]">
                      {packet.tcpFlags.raw || [
                        packet.tcpFlags.syn && 'SYN',
                        packet.tcpFlags.ack && 'ACK',
                        packet.tcpFlags.fin && 'FIN',
                        packet.tcpFlags.rst && 'RST',
                        packet.tcpFlags.psh && 'PSH',
                        packet.tcpFlags.urg && 'URG',
                      ].filter(Boolean).join('+')}
                    </span>
                  }
                  note="Control bits for connection state"
                />
              )}
              {packet.dnsQuery && (
                <FieldRow
                  label="DNS Query"
                  value={packet.dnsQuery}
                  note="Domain name being resolved"
                />
              )}
              {packet.httpMethod && (
                <FieldRow
                  label="HTTP Method"
                  value={packet.httpMethod}
                  note="Request action (GET, POST, PUT…)"
                />
              )}
              {packet.httpUri && (
                <FieldRow
                  label="HTTP URI"
                  value={<span className="truncate max-w-[180px] block">{packet.httpUri}</span>}
                  note="Requested resource path"
                />
              )}
            </div>
          </div>

          {/* Network Context */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-2">Network Context</h4>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.networkContext}</p>
          </div>

          {/* Protocol note */}
          <div className="p-3 rounded-lg bg-black/40 border border-white/10">
            <span className="text-[11px] font-semibold text-cyber-blue block mb-1">Protocol Layer Note:</span>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.protocolNote}</p>
          </div>

          {/* Analyst hint */}
          <div className="p-3 rounded-lg bg-cyber-neon/5 border border-cyber-neon/20">
            <span className="text-[11px] font-semibold text-cyber-neon block mb-1">🔍 Analyst Hint:</span>
            <p className="text-xs text-cyber-muted leading-relaxed">{explanation.analystHint}</p>
          </div>

          {/* Info field */}
          {packet.info && (
            <div>
              <h4 className="text-xs font-semibold text-white mb-2">TShark Info String</h4>
              <div className="p-3 rounded-lg bg-black/60 border border-white/10">
                <code className="text-[11px] text-cyber-text font-mono leading-relaxed break-all">{packet.info}</code>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}
