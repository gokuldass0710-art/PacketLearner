import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'motion/react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import type { NavItemKey } from './components/layout/Sidebar'
import { StatCard } from './components/dashboard/StatCard'
import { ProtocolChart } from './components/dashboard/ProtocolChart'
import { TrafficTimeline } from './components/dashboard/TrafficTimeline'
import { RecentCaptures, type CaptureItem } from './components/dashboard/RecentCaptures'
import { LearningCard } from './components/dashboard/LearningCard'
import { CaptureAgentPanel } from './components/dashboard/CaptureAgentPanel'
import { UploadModal } from './components/dashboard/UploadModal'
import { CyberButton } from './components/ui/CyberButton'
import { GlassCard } from './components/ui/GlassCard'
import { ProtocolBadge } from './components/ui/Badge'
import { LearningCenter } from './components/learning/LearningCenter'
import { PacketIntelPanel } from './components/learning/PacketIntelPanel'
import { askOpenAIAssistant, checkBackendHealth, getAssistantConfig, getCaptureHistory } from './services/api'
import type { AnalysisResponse, AssistantConversationMessage, AssistantProvider, AssistantQuestionRequest, Packet, SavedCaptureSummary } from './types'
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

const toCaptureItem = (item: SavedCaptureSummary): CaptureItem => ({
  id: item.id,
  name: item.fileName,
  format: item.format,
  size: `${(item.fileSizeBytes / 1024 / 1024).toFixed(2)} MB`,
  packets: item.totalPackets,
  duration: `${String(Math.floor(item.durationSeconds / 60)).padStart(2, '0')}m ${String(Math.round(item.durationSeconds % 60)).padStart(2, '0')}s`,
  status: item.findingsCount > 0 ? 'Suspicious Found' : 'Clean',
  date: new Date(item.createdAt).toLocaleString(),
  isReal: true,
})

export default function App() {
  const [currentView, setCurrentView] = useState<NavItemKey>('overview')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [backendConnected, setBackendConnected] = useState<boolean>(false)
  const [tsharkVersion, setTsharkVersion] = useState<string | null>(null)

  // Real capture data state from FastAPI backend
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null)
  const [recentCaptures, setRecentCaptures] = useState<CaptureItem[]>([])

  // Packet Explorer filter + selected packet (Phase 4)
  const [explorerSearch, setExplorerSearch] = useState('')
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL')
  const [selectedPacket, setSelectedPacket] = useState<Packet | null>(null)
  const [findingSeverityFilter, setFindingSeverityFilter] = useState('ALL')
  const [findingRuleFilter, setFindingRuleFilter] = useState('ALL')
  const [assistantMessages, setAssistantMessages] = useState<AssistantConversationMessage[]>([])
  const [assistantQuestion, setAssistantQuestion] = useState('')
  const [assistantLoading, setAssistantLoading] = useState(false)
  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [assistantProvider, setAssistantProvider] = useState<AssistantProvider>('openai')
  const [assistantModel, setAssistantModel] = useState<string>('')
  const [assistantConfigError, setAssistantConfigError] = useState<string | null>(null)

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
    getCaptureHistory()
      .then((items) => setRecentCaptures(items.map(toCaptureItem)))
      .catch(() => { /* Local development can run without a configured database. */ })
  }, [])

  useEffect(() => {
    getAssistantConfig()
      .then((config) => { setAssistantProvider(config.provider); setAssistantModel(config.model); setAssistantConfigError(null) })
      .catch((error: unknown) => { setAssistantConfigError(error instanceof Error ? error.message : 'Assistant configuration unavailable.') })
  }, [])

  const handleAnalysisSuccess = (data: AnalysisResponse) => {
    setAnalysisData(data)
    setAssistantMessages([])
    setAssistantError(null)

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
    getCaptureHistory()
      .then((items) => setRecentCaptures(items.map(toCaptureItem)))
      .catch(() => { /* Keep the current session entry if persistence is unavailable. */ })
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

  const filteredFindings = useMemo(() => {
    if (!analysisData) return []
    return analysisData.findings.filter((finding) => (
      (findingSeverityFilter === 'ALL' || finding.severity === findingSeverityFilter) &&
      (findingRuleFilter === 'ALL' || finding.ruleId === findingRuleFilter)
    ))
  }, [analysisData, findingRuleFilter, findingSeverityFilter])

  const inspectFindingPacket = (packetId: number) => {
    const packet = analysisData?.packets.find((candidate) => candidate.id === packetId)
    setSelectedPacket(packet ?? null)
    setExplorerSearch(String(packetId))
    setProtocolFilter('ALL')
    setCurrentView('explorer')
  }

  const askAssistant = async () => {
    const question = assistantQuestion.trim()
    if (!question || assistantLoading) return
    if (!analysisData) {
      setAssistantError('Upload a PCAP or PCAPNG before asking about capture evidence.')
      return
    }

    const userMessage: AssistantConversationMessage = { role: 'user', content: question }
    setAssistantQuestion('')
    setAssistantError(null)
    setAssistantMessages((previous) => [...previous, userMessage])
    setAssistantLoading(true)

    const selectedPacketContext = selectedPacket
      ? {
          id: selectedPacket.id,
          timestamp: selectedPacket.timestamp,
          sourceIp: selectedPacket.sourceIp,
          destinationIp: selectedPacket.destinationIp,
          sourcePort: selectedPacket.sourcePort,
          destinationPort: selectedPacket.destinationPort,
          protocol: selectedPacket.protocol,
          length: selectedPacket.length,
          tcpFlags: selectedPacket.tcpFlags,
        }
      : undefined
    const request: AssistantQuestionRequest = {
      question,
      provider: assistantProvider,
      context: {
        fileName: analysisData.metadata.fileName,
        format: analysisData.metadata.format,
        totalPackets: analysisData.metadata.totalPackets,
        returnedPackets: analysisData.metadata.returnedPackets,
        durationSeconds: analysisData.metadata.durationSeconds,
        protocols: analysisData.protocolCounts,
        selectedPacket: selectedPacketContext,
        findings: analysisData.findings,
      },
      conversation: [...assistantMessages, userMessage].slice(-8),
    }

    try {
      const response = await askOpenAIAssistant(request)
      setAssistantMessages((previous) => [...previous, { role: 'assistant', content: response.answer }])
    } catch (error: unknown) {
      setAssistantError(error instanceof Error ? error.message : 'The selected assistant provider is unavailable.')
    } finally {
      setAssistantLoading(false)
    }
  }

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

      {/* Main View Switching */}
      {currentView === 'capture' && <CaptureAgentPanel onAnalysisSuccess={handleAnalysisSuccess} />}
      {currentView === 'overview' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          {/* Welcome & Action Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-white/5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white">
                  Dashboard overview
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-neon border border-cyber-neon/30 font-mono">
                  {analysisData ? 'TShark live data' : 'Demo sample'}
                </span>
              </div>
              <p className="text-xs lg:text-sm text-cyber-muted mt-1">
                Packet activity and protocol distribution at a glance.
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
                onClick={() => setCurrentView('capture')}
                icon={<Radio className="w-4 h-4 text-cyber-neon" />}
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
                  <span className="font-semibold text-white">Active capture: </span>
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
                  Clear capture
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-cyber-surface/70 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-cyber-muted">
                <Info className="w-4 h-4 text-cyber-blue flex-shrink-0" />
                <span>
                  <strong>Demonstration mode.</strong> Dashboard values are illustrative samples. Upload a <code>.pcap</code> or <code>.pcapng</code> capture to analyze it with the local TShark backend.
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
                  {backendConnected ? 'Backend connected' : 'Backend offline'}
                </span>
                <span className="text-[10px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  Demo sample
                </span>
              </div>
            </div>
          )}

          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Packets analyzed"
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
              title="Protocol diversity"
              value={
                analysisData
                  ? analysisData.protocolCounts.length
                  : 6
              }
              unit="Protocols"
              description={
                analysisData
                  ? analysisData.protocolCounts.slice(0, 4).map((p) => p.protocol).join(', ')
                  : 'Six network protocols'
              }
              trend={{
                  value: analysisData ? 'Layers 2 to 7' : 'Layers 2 to 7',
                isPositive: true,
              }}
              icon={Layers}
              accent="neon"
            />
            <StatCard
              title="Top network talker"
              value={
                analysisData && analysisData.topTalkers.length > 0
                  ? analysisData.topTalkers[0].ip
                  : 'Not set'
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
              title="Data volume"
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
              accent="amber"
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
                      className={`text-xs font-mono px-2.5 py-1 rounded transition-colors duration-150 ${
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
                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full border transition-colors duration-150 ${
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
              <p className="text-xs text-cyber-muted">No potential finding met the configured evidence thresholds in {analysisData.metadata.fileName}.</p>
            </GlassCard>
          ) : (
            <div className="space-y-4">
              <GlassCard className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-mono text-cyber-muted">
                  <Filter className="w-3.5 h-3.5 text-cyber-blue" />
                  Severity:
                  <select value={findingSeverityFilter} onChange={(e) => setFindingSeverityFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-cyber-text focus:outline-none focus:border-cyber-blue">
                    <option value="ALL">All severities</option>
                    {['critical', 'high', 'medium', 'low', 'info'].map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyber-muted">
                  Rule:
                  <select value={findingRuleFilter} onChange={(e) => setFindingRuleFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-cyber-text focus:outline-none focus:border-cyber-blue">
                    <option value="ALL">All rules</option>
                    {[...new Set(analysisData.findings.map((finding) => finding.ruleId))].map((ruleId) => <option key={ruleId} value={ruleId}>{ruleId}</option>)}
                  </select>
                </div>
                <span className="text-[11px] font-mono text-cyber-muted md:ml-auto">Showing {filteredFindings.length} of {analysisData.findings.length} potential findings</span>
              </GlassCard>

              {filteredFindings.length === 0 ? (
                <GlassCard className="p-8 text-center space-y-2">
                  <Filter className="w-7 h-7 text-cyber-muted mx-auto" />
                  <h3 className="text-sm font-semibold text-white">No matching findings</h3>
                  <p className="text-xs text-cyber-muted">Adjust the severity or rule filter to review other potential findings.</p>
                </GlassCard>
              ) : filteredFindings.map((finding) => (
                <GlassCard key={finding.id} className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{finding.title}</h3>
                        <div className="text-[11px] text-cyber-neon font-mono">{finding.ruleName}</div>
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
                      <div>Packets: <span className="text-white">{finding.packetCount}</span></div>
                      <div className="flex flex-wrap items-center gap-1">Evidence IDs:
                        {finding.relevantPacketIds.map((packetId) => {
                          const available = analysisData.packets.some((packet) => packet.id === packetId)
                          return <button key={packetId} onClick={() => inspectFindingPacket(packetId)} className={`underline underline-offset-2 ${available ? 'text-cyber-neon hover:text-white' : 'text-amber-300 hover:text-white'}`} title={available ? 'Open packet in Packet Explorer' : 'Packet is outside the returned packet list; open Explorer to search it'}>#{packetId}{!available && ' *'}</button>
                        })}
                      </div>
                      <div>Window: <span className="text-white">{finding.timeWindow.startSeconds.toFixed(3)}s–{finding.timeWindow.endSeconds.toFixed(3)}s ({finding.timeWindow.durationSeconds.toFixed(3)}s)</span></div>
                      {finding.relevantPacketIds.some((packetId) => !analysisData.packets.some((packet) => packet.id === packetId)) && <div className="text-amber-300">* Packet is not in the {analysisData.metadata.returnedPackets} records returned to the UI; the finding still uses full-capture evidence.</div>}
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

      {/* OpenAI Assistant View */}
      {currentView === 'assistant' && (
        <div className="space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyber-neon" />
                {assistantProvider === 'ollama' ? 'Local Ollama Assistant' : 'OpenAI Assistant'}
              </h1>
              <p className="text-xs text-cyber-muted mt-1">
                Ask beginner-friendly questions about the loaded capture and its potential findings.
              </p>
            </div>
            <CyberButton variant="outline" size="sm" onClick={() => { setAssistantMessages([]); setAssistantError(null) }}>
              New conversation
            </CyberButton>
          </div>

          <GlassCard className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-cyber-muted">
                <span className={`w-2 h-2 rounded-full ${analysisData ? 'bg-cyber-neon' : 'bg-amber-400'}`} />
                {analysisData ? `Context: ${analysisData.metadata.fileName}` : 'No capture loaded'}
              </div>
              <span className="text-[10px] font-mono text-cyber-muted">Structured metadata only · no PCAP or payloads sent</span>
            </div>

            <div className="min-h-56 max-h-[420px] overflow-y-auto rounded-xl bg-black/30 border border-white/10 p-4 space-y-3">
              {assistantMessages.length === 0 ? (
                <div className="space-y-3 text-center py-8">
                  <Sparkles className="w-8 h-8 text-cyber-neon mx-auto" />
                  <h3 className="text-sm font-semibold text-white">What would you like to understand?</h3>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['What happened in this capture?', 'Explain the potential findings', 'What should I inspect next?'].map((suggestion) => (
                      <button key={suggestion} onClick={() => setAssistantQuestion(suggestion)} className="text-xs text-cyber-muted hover:text-cyber-neon border border-white/10 hover:border-cyber-neon/40 rounded-lg px-3 py-2 text-left">
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : assistantMessages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${message.role === 'user' ? 'bg-cyber-blue/30 text-white border border-cyber-blue/40' : 'bg-cyber-surface text-cyber-text border border-cyber-neon/20'}`}>
                    <div className="text-[10px] font-mono text-cyber-muted mb-1">{message.role === 'user' ? 'You' : (assistantProvider === 'ollama' ? 'Local Ollama Assistant' : 'OpenAI Assistant')}</div>
                    {message.content}
                  </div>
                </div>
              ))}
              {assistantLoading && <div className="text-xs text-cyber-muted animate-pulse">{assistantProvider === 'ollama' ? 'Local Ollama is reviewing the supplied evidence…' : 'OpenAI Assistant is reviewing the supplied evidence…'}</div>}
            </div>

            {assistantError && <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs p-3">{assistantError}<div className="mt-1 text-amber-100/70">Provider configuration stays in the backend. OpenAI keys are never sent to the frontend.</div></div>}

            <div className="flex gap-2">
              <input value={assistantQuestion} onChange={(event) => setAssistantQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void askAssistant() }} maxLength={2000} placeholder={analysisData ? 'Ask about the current capture…' : 'Load a capture to begin'} disabled={!analysisData || assistantLoading} className="flex-1 rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder:text-cyber-muted focus:outline-none focus:border-cyber-neon disabled:opacity-50" />
              <CyberButton variant="neon" size="sm" onClick={() => void askAssistant()} disabled={!analysisData || assistantLoading || !assistantQuestion.trim()}>
                Ask
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
              <p className="text-xs text-cyber-muted mt-1">Configure capture parameters, assistant provider, and display options.</p>
            </div>
          </div>

          <GlassCard className="p-6 space-y-4 text-xs">
            <div className="py-2 border-b border-white/5 space-y-3">
              <div>
                <span className="font-semibold text-white block">Assistant provider</span>
                <span className="text-cyber-muted text-[11px]">Choose whether bounded structured evidence is handled by OpenAI or your local Ollama service.</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <select value={assistantProvider} onChange={(event) => setAssistantProvider(event.target.value as AssistantProvider)} className="rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-white">
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Local Ollama</option>
                </select>
                <span className="text-cyber-muted font-mono">Model: <span className="text-white">{assistantModel || 'configured in backend/.env'}</span></span>
              </div>
              <p className="text-[11px] text-cyber-muted">Ollama is restricted to http://127.0.0.1:11434 and requires no API key. Set its local model name in backend/.env.</p>
              {assistantConfigError && <p className="text-[11px] text-amber-300">{assistantConfigError}</p>}
            </div>
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
