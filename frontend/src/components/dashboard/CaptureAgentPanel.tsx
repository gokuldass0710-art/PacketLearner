import { useEffect, useState } from 'react'
import { AlertCircle, CircleStop, Loader2, Radio, RefreshCw, ShieldCheck } from 'lucide-react'
import { ApiError, getCaptureStatus, listCaptureInterfaces, startLocalCapture, stopLocalCapture } from '../../services/api'
import type { AnalysisResponse, CaptureInterface, CaptureStatus } from '../../types'
import { CyberButton } from '../ui/CyberButton'
import { GlassCard } from '../ui/GlassCard'

interface CaptureAgentPanelProps { onAnalysisSuccess: (data: AnalysisResponse) => void }
const formatElapsed = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`

export function CaptureAgentPanel({ onAnalysisSuccess }: CaptureAgentPanelProps) {
  const [interfaces, setInterfaces] = useState<CaptureInterface[]>([])
  const [selectedInterface, setSelectedInterface] = useState('')
  const [captureStatus, setCaptureStatus] = useState<CaptureStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const loadInterfaces = async () => { setError(null); try { const available = await listCaptureInterfaces(); setInterfaces(available); setSelectedInterface((current) => current || available[0]?.id || '') } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not list local capture interfaces.') } }
  useEffect(() => { void loadInterfaces(); void getCaptureStatus().then(setCaptureStatus).catch(() => undefined) }, [])
  useEffect(() => { if (captureStatus?.status !== 'running') return; const timer = window.setInterval(() => { void getCaptureStatus().then(setCaptureStatus).catch(() => undefined) }, 1000); return () => window.clearInterval(timer) }, [captureStatus?.status])
  const start = async () => { if (!selectedInterface || busy) return; setBusy(true); setError(null); try { setCaptureStatus(await startLocalCapture(selectedInterface)) } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not start local capture.') } finally { setBusy(false) } }
  const stop = async () => { if (busy) return; setBusy(true); setError(null); try { onAnalysisSuccess(await stopLocalCapture()); setCaptureStatus(await getCaptureStatus()) } catch (err) { setError(err instanceof ApiError ? err.message : 'Could not stop and analyze the capture.') } finally { setBusy(false) } }
  const running = captureStatus?.status === 'running'
  const canAnalyze = running || captureStatus?.status === 'ready'
  return <div className="max-w-3xl mx-auto space-y-6">
    <div><h1 className="text-2xl font-bold text-white flex items-center gap-2"><Radio className="w-6 h-6 text-cyber-neon" /> Local Capture Agent</h1><p className="text-xs text-cyber-muted mt-1">Capture stays on this machine and is analyzed by the existing local TShark backend.</p></div>
    <GlassCard className="p-5 space-y-5">
      <div className="flex items-center justify-between"><div><div className="text-sm font-semibold text-white">Capture status</div><div className="text-xs text-cyber-muted mt-1">{running ? 'TShark is capturing until you stop it or a safety limit is reached.' : 'Nothing is captured until you press Start capture.'}</div></div><span className={`text-xs font-mono px-2 py-1 rounded border ${running ? 'text-cyber-neon border-cyber-neon/30 bg-cyber-neon/10' : 'text-cyber-muted border-white/10 bg-white/5'}`}>{running ? 'RUNNING' : (captureStatus?.status ?? 'IDLE').toUpperCase()}</span></div>
      <div className="grid sm:grid-cols-2 gap-4"><label className="text-xs text-cyber-muted">Network interface<select value={selectedInterface} onChange={(e) => setSelectedInterface(e.target.value)} disabled={running || busy} className="mt-2 w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-xs text-white"><option value="">Select an interface</option>{interfaces.map((item) => <option key={item.id} value={item.id}>{item.id}: {item.name}{item.description ? ` — ${item.description}` : ''}</option>)}</select></label><div className="rounded-lg bg-black/30 border border-white/10 p-3 text-xs text-cyber-muted"><div>Duration <span className="float-right text-white">{formatElapsed(captureStatus?.elapsed_seconds ?? 0)} / {formatElapsed(captureStatus?.duration_limit_seconds ?? 0)}</span></div><div className="mt-2">File limit <span className="float-right text-white">{captureStatus?.max_size_mb ?? '—'} MB</span></div></div></div>
      <div className="flex flex-wrap gap-3"><CyberButton variant="neon" onClick={() => void start()} disabled={running || busy || !selectedInterface} icon={busy && !running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}>Start capture</CyberButton><CyberButton variant="outline" onClick={() => void stop()} disabled={!canAnalyze || busy} icon={busy && canAnalyze ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleStop className="w-4 h-4" />}>{running ? 'Stop and analyze' : 'Analyze completed capture'}</CyberButton><CyberButton variant="ghost" onClick={() => void loadInterfaces()} disabled={running || busy} icon={<RefreshCw className="w-4 h-4" />}>Refresh interfaces</CyberButton></div>
      <div className="flex gap-2 text-[11px] text-cyber-muted"><ShieldCheck className="w-4 h-4 text-cyber-neon shrink-0" /><span>Promiscuous mode is disabled. Use only interfaces and traffic you own or are authorized to inspect. Capture files are temporary and deleted after analysis.</span></div>
      {error && <div className="flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
    </GlassCard>
  </div>
}
