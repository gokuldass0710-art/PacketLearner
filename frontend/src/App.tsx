import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import type { NavItemKey } from './components/layout/Sidebar'
import { StatCard } from './components/dashboard/StatCard'
import { ProtocolChart } from './components/dashboard/ProtocolChart'
import { TrafficTimeline } from './components/dashboard/TrafficTimeline'
import { RecentCaptures, type CaptureItem } from './components/dashboard/RecentCaptures'
import { LearningCard } from './components/dashboard/LearningCard'
import { UploadModal } from './components/dashboard/UploadModal'
import { CyberButton } from './components/ui/CyberButton'
import { GlassCard } from './components/ui/GlassCard'
import { ProtocolBadge } from './components/ui/Badge'
import { LearningCenter } from './components/learning/LearningCenter'
import { PacketIntelPanel } from './components/learning/PacketIntelPanel'
import { checkBackendHealth } from './services/api'
import type { AnalysisResponse, Packet } from './types'
import {
  UploadCloud,
  Radio,
  Layers,
  AlertTriangle,
  HardDrive,
  Info,
  Terminal,
  GraduationCap,
  Sparkles,
  SearchCode,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  Zap,
} from 'lucide-react'

export default function App() {
  const [currentView, setCurrentView] = useState<NavItemKey>('overview')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [liveCaptureNoticeOpen, setLiveCaptureNoticeOpen] = useState(false)
  const [backendConnected, setBackendConnected] = useState<boolean>(false)
  const [tsharkVersion, setTsharkVersion] = useState<string | null>(null)

  // Real capture data state from FastAPI backend
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [recentCaptures, setRecentCaptures] = useState<CaptureItem[]>([])

  // Packet Explorer filter + selected packet (Phase 4)
  const [explorerSearch, setExplorerSearch] = useState('')
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL')
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null)

  // Check backend health on initial mount
  useEffect(() => {
    checkBackendHealth()
      .then((health) => {
        setBackendConnected(health.status === 'ok')
        if (health.tshark_version) {
          setTsharkVersion(health.tshark_version)
        }
      })
      .catch(() => {
        setBackendConnected(false)
      })
  }, [])

  const handleAnalysisSuccess = (data: AnalysisResponse) => {
    setAnalysisData(data)

    // Add to recent captures list
    const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60)
      const s = Math.round(sec % 60)
      return `${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
    }

    const newCapture: CaptureItem = {
      id: `cap-${Date.now()}`,
      name: data.metadata.fileName,
      format: data.metadata.format,
      size: `${(data.metadata.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`,
      packets: data.metadata.totalPackets,
      duration: formatDuration(data.metadata.durationSeconds),
      status: data.findings.length > 0 ? 'Suspicious Found' : 'Clean',
      date: 'Just analyzed',
      isReal: true,
    }

    setRecentCaptures((prev) => [newCapture, ...prev.filter((c) => c.isReal)])
  }

  // Filtered packets for the Explorer tab
  const filteredPackets = useMemo(() => {
    if (!analysisData) return []
    return analysisData.packets.filter((p) => {
      const matchesProto =
        protocolFilter === 'ALL' ||
        p.protocol.toUpperCase() === protocolFilter.toUpperCase()

      const query = explorerSearch.toLowerCase().trim()
      if (!query) return matchesProto

      const matchesSearch =
        p.sourceIp.toLowerCase().includes(query) ||
        p.destinationIp.toLowerCase().includes(query) ||
        p.protocol.toLowerCase().includes(query) ||
        p.info.toLowerCase().includes(query) ||
        String(p.id).includes(query) ||
        (p.sourcePort && String(p.sourcePort).includes(query)) ||
        (p.destinationPort && String(p.destinationPort).includes(query))

      return matchesProto && matchesSearch
    })
  }, [analysisData, protocolFilter, explorerSearch])

  return (
    <DashboardLayout
      currentView={currentView}
      onSelectView={setCurrentView}
      onOpenUpload={() => setIsUploadOpen(true)}
    >
      {/* Upload PCAP Modal connected to FastAPI backend */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisSuccess={handleAnalysisSuccess}
      />

      {/* Live Capture Offline Notice Modal */}
      {liveCaptureNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-cyber-surface border border-white/15 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Live Capture Agent Offline</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Planned for Phase 7
                </span>
              </div>
            </div>

            <p className="text-xs text-cyber-muted leading-relaxed">
              Browsers cannot directly sniff physical network interfaces for security reasons. Live capture requires running the local <strong>TShark capture agent</strong> with elevated permissions.
            </p>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono space-y-1 text-cyber-text">
              <div className="text-[11px] text-cyber-muted">Planned Agent Command:</div>
              <code className="text-cyber-neon text-[11px] block">
                packetlearner-agent --interface eth0 --stream ws://localhost:8000/live
              </code>
            </div>

            <div className="pt-2 flex justify-end">
              <CyberButton variant="blue" size="sm" onClick={() => setLiveCaptureNoticeOpen(false)}>
                Understood
              </CyberButton>
            </div>
          </div>
        </div>
      )}

      {/* Main View Switching */}
      {currentView === 'overview' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Welcome & Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                  Network Traffic Monitor
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-neon border border-cyber-neon/30 font-mono">
                  {analysisData ? 'TShark Live Data' : 'Phase 4 Active'}
                </span>
              </div>
              <p className="text-xs lg:text-sm text-cyber-muted mt-1">
                Learn the Traffic. Understand the Threat. Designed for Cybersecurity Beginners.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-3">
              <CyberButton
                variant="neon"
                size="md"
                onClick={() => setIsUploadOpen(true)}
                icon={<UploadCloud className="w-4 h-4" />}
              >
                Upload PCAP / PCAPNG
              </CyberButton>

              <CyberButton
                variant="outline"
                size="md"
                onClick={() => setLiveCaptureNoticeOpen(true)}
                icon={<Radio className="w-4 h-4 text-amber-400" />}
              >
                Start Live Capture
              </CyberButton>
            </div>
          </div>

          {/* Active Capture Banner or Demo Data Disclaimer */}
          {analysisData ? (
            <div className="p-3.5 rounded-xl bg-cyber-surface/90 border border-cyber-neon/40 shadow-xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyber-neon flex-shrink-0" />
                <div>
                  <span className="font-semibold text-white">Active TShark Capture: </span>
                  <span className="font-mono text-cyber-neon font-bold">
                    {analysisData.metadata.fileName}
                  </span>
                  <span className="text-cyber-muted ml-2">
                    ({analysisData.metadata.totalPackets.toLocaleString()} total packets, {analysisData.metadata.durationSeconds}s duration, {analysisData.protocolCounts.length} protocols)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <CyberButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentView('explorer')}
                  icon={<SearchCode className="w-3.5 h-3.5" />}
                >
                  View in Explorer
                </CyberButton>
                <button
                  onClick={() => setAnalysisData(null)}
                  className="text-[11px] font-mono text-cyber-muted hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20"
                >
                  Reset Demo
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-cyber-surface/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-cyber-muted">
                <Info className="w-4 h-4 text-cyber-blue flex-shrink-0" />
                <span>
                  <strong>Demonstration Mode:</strong> Dashboard displays illustrative sample metrics. Upload a real <code>.pcap</code> or <code>.pcapng</code> capture to decode with local TShark backend.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    backendConnected
                      ? 'bg-cyber-neon/10 text-cyber-neon border-cyber-neon/30'
                      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {backendConnected ? 'Backend Connected' : 'Backend Offline'}
                </span>
                <span className="text-[10px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  Demo Sample
                </span>
              </div>
            </div>
          )}

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Packets Analyzed"
              value={
                analysisData
                  ? analysisData.metadata.totalPackets.toLocaleString()
                  : '7,050'
              }
              unit="pkts"
              description={
                analysisData
                  ? `Returned ${analysisData.metadata.returnedPackets} records`
                  : 'Parsed across sample captures'
              }
              trend={{
                value: analysisData ? 'Real Capture' : '+14.2%',
                isPositive: true,
              }}
              icon={Terminal}
              accent="blue"
            />
            <StatCard
              title="Protocol Diversity"
              value={
                analysisData
                  ? analysisData.protocolCounts.length
                  : 6
              }
              unit="Protocols"
              description={
                analysisData
                  ? analysisData.protocolCounts.slice(0, 4).map((p) => p.protocol).join(', ')
                  : 'TCP, TLS, DNS, UDP, HTTP, ARP'
              }
              trend={{
                value: analysisData ? 'L2 - L7 Dissected' : 'L2 - L7',
                isPositive: true,
              }}
              icon={Layers}
              accent="neon"
            />
            <StatCard
              title="Top Network Talker"
              value={
                analysisData && analysisData.topTalkers.length > 0
                  ? analysisData.topTalkers[0].ip
                  : '—'
              }
              description={
                analysisData && analysisData.topTalkers.length > 0
                  ? `${analysisData.topTalkers[0].packetCount} pkts (${Math.round(analysisData.topTalkers[0].bytes / 1024)} KB)`
                  : 'Upload a capture to inspect traffic'
              }
              trend={{
                value: analysisData ? 'Active Node' : 'Sample view',
                isPositive: !analysisData,
              }}
              icon={AlertTriangle}
              accent="amber"
            />
            <StatCard
              title="Data Volume"
              value={
                analysisData
                  ? (analysisData.metadata.fileSizeBytes / 1024 / 1024).toFixed(2)
                  : '4.4'
              }
              unit="MB"
              description={
                analysisData
                  ? `${analysisData.metadata.durationSeconds}s duration`
                  : 'Combined sample PCAPs'
              }
              trend={{
                value: analysisData ? `${analysisData.metadata.format.toUpperCase()}` : '05m 29s total',
                isPositive: true,
              }}
              icon={HardDrive}
              accent="purple"
            />
          </div>

          {/* Middle Row: Protocol Distribution & Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <ProtocolChart
                data={analysisData?.protocolCounts}
                totalPackets={analysisData?.metadata.totalPackets}
                isRealData={!!analysisData}
              />
            </div>
            <div className="lg:col-span-7">
              <TrafficTimeline
                packets={analysisData?.packets}
                durationSeconds={analysisData?.metadata.durationSeconds}
                isRealData={!!analysisData}
              />
            </div>
          </div>

          {/* Bottom Row: Recent Captures & Learning Center */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <RecentCaptures
                captures={recentCaptures}
                backendConnected={backendConnected}
                onSelectCapture={() => setCurrentView('explorer')}
              />
            </div>
            <div className="lg:col-span-6">
              <LearningCard onSelectTopic={() => setCurrentView('learning')} />
            </div>
          </div>
        </div>
      )}

      {/* Packet Explorer View with Real TShark Data + Phase 4 Packet Intel Panel */}
      {currentView === 'explorer' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <SearchCode className="w-6 h-6 text-cyber-neon" />
                Packet Explorer
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                {analysisData
                  ? `Displaying ${filteredPackets.length} of ${analysisData.metadata.returnedPackets} decoded packets from ${analysisData.metadata.fileName} — click any row for AI explanation`
                  : 'Deep packet inspection with filters for protocol, IPs, ports, and TCP flags.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CyberButton variant="neon" size="sm" onClick={() => setIsUploadOpen(true)}>
                Upload Capture
              </CyberButton>
            </div>
          </div>

          {analysisData ? (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <GlassCard className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono text-cyber-muted flex items-center gap-1.5 mr-1">
                    <Filter className="w-3.5 h-3.5 text-cyber-blue" />
                    Protocol:
                  </span>
                  {['ALL', ...analysisData.protocolCounts.slice(0, 5).map((p) => p.protocol)].map((proto) => (
                    <button
                      key={proto}
                      onClick={() => setProtocolFilter(proto)}
                      className={`text-xs font-mono px-2.5 py-1 rounded transition-all ${
                        protocolFilter === proto
                          ? 'bg-cyber-blue text-white shadow-sm shadow-cyber-blue/40 font-bold'
                          : 'bg-white/5 text-cyber-muted hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {proto}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <Search className="w-3.5 h-3.5 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter IP, port, info..."
                      value={explorerSearch}
                      onChange={(e) => setExplorerSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1 text-xs bg-black/40 border border-white/10 rounded-lg text-cyber-text placeholder:text-cyber-muted/60 focus:outline-none focus:border-cyber-blue"
                    />
                  </div>
                  {selectedPacket && (
                    <button
                      onClick={() => setSelectedPacket(null)}
                      className="text-xs text-cyber-muted hover:text-white px-2.5 py-1 rounded bg-white/5 border border-white/10 hover:border-white/20 flex-shrink-0"
                    >
                      Close Panel
                    </button>
                  )}
                </div>
              </GlassCard>

              {/* Two-panel layout: table + intel panel */}
              <div className={`flex gap-4 ${selectedPacket ? 'flex-col xl:flex-row' : ''}`}>
                {/* Real Decoded Packet Table */}
                <div className={selectedPacket ? 'xl:flex-1 min-w-0' : 'w-full'}>
                  <GlassCard className="overflow-hidden">
                    <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-cyber-surface border-b border-white/10 text-cyber-muted uppercase text-[10px] tracking-wider z-10">
                          <tr>
                            <th className="p-3 w-16">No.</th>
                            <th className="p-3 w-28">Time (s)</th>
                            <th className="p-3">Source</th>
                            <th className="p-3">Destination</th>
                            <th className="p-3 w-20">Protocol</th>
                            <th className="p-3 w-20">Length</th>
                            <th className="p-3">Info</th>
                            <th className="p-3 w-16 text-center">Intel</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredPackets.map((pkt) => (
                            <tr
                              key={pkt.id}
                              onClick={() => setSelectedPacket(selectedPacket?.id === pkt.id ? null : pkt)}
                              className={`hover:bg-white/[0.04] transition-colors group cursor-pointer ${
                                selectedPacket?.id === pkt.id
                                  ? 'bg-cyber-blue/10 border-l-2 border-cyber-blue'
                                  : ''
                              }`}
                            >
                              <td className="p-3 text-cyber-muted">{pkt.id}</td>
                              <td className="p-3 text-white/80">{pkt.formattedTime}</td>
                              <td className="p-3 text-cyber-text">
                                <span className="font-semibold text-white">{pkt.sourceIp}</span>
                                {pkt.sourcePort && (
                                  <span className="text-cyber-muted text-[11px]">:{pkt.sourcePort}</span>
                                )}
                              </td>
                              <td className="p-3 text-cyber-text">
                                <span className="font-semibold text-white">{pkt.destinationIp}</span>
                                {pkt.destinationPort && (
                                  <span className="text-cyber-muted text-[11px]">:{pkt.destinationPort}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <ProtocolBadge protocol={pkt.protocol} />
                              </td>
                              <td className="p-3 text-cyber-muted">{pkt.length} B</td>
                              <td className="p-3 text-cyber-text truncate max-w-xs md:max-w-sm">
                                {pkt.info}
                                {pkt.tcpFlags && pkt.tcpFlags.raw && (
                                  <span className="ml-2 text-[10px] text-cyber-neon px-1.5 py-0.2 rounded bg-cyber-neon/10 border border-cyber-neon/20">
                                    {pkt.tcpFlags.raw}
                                  </span>
                                )}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border transition-all ${
                                  selectedPacket?.id === pkt.id
                                    ? 'bg-cyber-blue border-cyber-blue text-white'
                                    : 'border-white/20 text-cyber-muted group-hover:border-cyber-neon group-hover:text-cyber-neon'
                                }`}>
                                  <Zap className="w-3 h-3" />
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
                      <span>
                        Showing {filteredPackets.length} of {analysisData.metadata.returnedPackets} packets (Total in file: {analysisData.metadata.totalPackets.toLocaleString()})
                      </span>
                      <span className="text-[10px] font-mono text-cyber-neon">
                        {selectedPacket ? '⚡ Row selected — Intel Panel open' : 'Click any row for AI explanation'}
                      </span>
                    </div>
                  </GlassCard>
                </div>

                {/* Packet Intel Panel (Phase 4) */}
                <AnimatePresence>
                  {selectedPacket && (
                    <div className="xl:w-96 flex-shrink-0">
                      <PacketIntelPanel
                        packet={selectedPacket}
                        onClose={() => setSelectedPacket(null)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <GlassCard className="p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-cyber-blue/15 border border-cyber-blue/40 flex items-center justify-center text-cyber-neon mx-auto">
                <SearchCode className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-base font-semibold text-white">No Capture File Loaded</h3>
                <p className="text-xs text-cyber-muted leading-relaxed">
                  Upload a <code>.pcap</code> or <code>.pcapng</code> file to inspect real frame bytes, IP addresses, port conversations, and TCP handshake flags. Click any row for AI-powered packet explanations.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <CyberButton variant="neon" size="sm" onClick={() => setIsUploadOpen(true)}>
                  Upload Capture Now
                </CyberButton>
                <CyberButton variant="outline" size="sm" onClick={() => setCurrentView('overview')}>
                  Return to Dashboard
                </CyberButton>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Traffic Analysis View */}
      {currentView === 'analysis' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-cyber-blue" />
                Traffic Analysis &amp; Flows
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                Visualizing communication relationships, conversations, and bandwidth distribution.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProtocolChart
              data={analysisData?.protocolCounts}
              totalPackets={analysisData?.metadata.totalPackets}
              isRealData={!!analysisData}
            />
            <TrafficTimeline
              packets={analysisData?.packets}
              durationSeconds={analysisData?.metadata.durationSeconds}
              isRealData={!!analysisData}
            />
          </div>
        </div>
      )}

      {/* Learning Center View (Phase 4) */}
      {currentView === 'learning' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-cyber-neon" />
                Cybersecurity Learning Center
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                Interactive protocol deep-dives, TCP handshake visualizer, narrative traffic story mode, and beginner quizzes.
              </p>
            </div>
          </div>

          <LearningCenter
            packets={analysisData?.packets}
            isRealData={!!analysisData}
          />
        </div>
      )}

      {/* Security Investigation View */}
      {currentView === 'investigation' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-amber-400" />
                Security Investigation &amp; Detection
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                Evidence-based suspicious activity detection and recommended next actions.
              </p>
            </div>
          </div>

          {!analysisData ? (
            <GlassCard className="p-8 text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-cyber-muted mx-auto" />
              <h3 className="text-sm font-semibold text-white">No capture loaded</h3>
              <p className="text-xs text-cyber-muted">Upload a PCAP or PCAPNG to run the detection rules.</p>
            </GlassCard>
          ) : analysisData.findings.length === 0 ? (
            <GlassCard className="p-8 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-cyber-neon mx-auto" />
              <h3 className="text-sm font-semibold text-white">No findings</h3>
              <p className="text-xs text-cyber-muted">No potential TCP port scan met the configured evidence threshold in {analysisData.metadata.fileName}.</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              {analysisData.findings.map((finding) => (
                <GlassCard key={finding.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                        <span className="text-[11px] text-cyber-muted font-mono">
                          Rule ID: {finding.ruleId} • Severity: {finding.severity}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Potential finding
                    </span>
                  </div>

                  <p className="text-xs text-cyber-muted leading-relaxed">{finding.explanation}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
                      <div className="text-cyber-neon font-semibold">Evidence</div>
                      <div>Source: <span className="text-white">{finding.sourceIp}</span></div>
                      <div>Destination: <span className="text-white">{finding.destinationIp}</span></div>
                      <div>Ports: <span className="text-white">{finding.observedDestinationPorts.join(', ')}</span></div>
                      <div>Packets: <span className="text-white">{finding.packetCount}</span> • IDs: <span className="text-white">{finding.relevantPacketIds.join(', ')}</span></div>
                      <div>Window: <span className="text-white">{finding.timeWindow.startSeconds.toFixed(3)}s–{finding.timeWindow.endSeconds.toFixed(3)}s ({finding.timeWindow.durationSeconds.toFixed(3)}s)</span></div>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                      <div className="text-cyber-neon font-semibold">Recommended Analyst Steps</div>
                      <ul className="list-disc list-inside text-cyber-muted space-y-0.5">
                        {finding.recommendedSteps.map((step) => <li key={step}>{step}</li>)}
                      </ul>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Network Copilot View */}
      {currentView === 'copilot' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyber-neon" />
                AI Network Copilot
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                Contextual AI assistance powered by OpenAI API for packet explanation and threat triage.
              </p>
            </div>
          </div>

          <GlassCard className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-cyber-neon/15 border border-cyber-neon/40 flex items-center justify-center text-cyber-neon mx-auto shadow-lg shadow-cyber-neon/10">
              <Sparkles className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-base font-semibold text-white">AI Copilot Architecture</h3>
              <p className="text-xs text-cyber-muted leading-relaxed">
                The Copilot receives structured detection evidence from the backend rather than raw binaries to protect user privacy and avoid AI hallucination.
              </p>
            </div>
            <div className="pt-2 flex justify-center">
              <CyberButton variant="blue" size="sm" onClick={() => setCurrentView('overview')}>
                Back to Dashboard
              </CyberButton>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Settings View */}
      {currentView === 'settings' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
              <p className="text-xs text-cyber-muted mt-1">Configure capture parameters and display options.</p>
            </div>
          </div>

          <GlassCard className="p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <span className="font-semibold text-white block">TShark Packet Decoder</span>
                <span className="text-cyber-muted text-[11px] font-mono truncate max-w-xs md:max-w-md block">
                  {tsharkVersion || 'C:\\Program Files\\Wireshark\\tshark.exe'}
                </span>
              </div>
              <span className={`font-mono ${backendConnected ? 'text-cyber-neon' : 'text-amber-400'}`}>
                {backendConnected ? 'Connected & Verified' : 'Checking / Standby'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <span className="font-semibold text-white block">3D Network Universe Background</span>
                <span className="text-cyber-muted text-[11px]">Interactive Three.js particle constellation</span>
              </div>
              <span className="text-cyber-neon font-mono">Active</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <span className="font-semibold text-white block">FastAPI Server URL</span>
                <span className="text-cyber-muted text-[11px]">http://127.0.0.1:8000</span>
              </div>
              <span className={`font-mono ${backendConnected ? 'text-cyber-neon' : 'text-amber-400'}`}>
                {backendConnected ? 'Online' : 'Offline'}
              </span>
            </div>
          </GlassCard>
        </div>
      )}
    </DashboardLayout>
  )
}
