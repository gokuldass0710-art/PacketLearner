/**
 * TCPHandshakeViz — Animated Three-Way Handshake visualization.
 * Uses Motion (framer-motion API) for packet animations.
 * No external dependencies beyond existing stack.
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { RotateCcw, ChevronLeft, ChevronRight, Play } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { CyberButton } from '../ui/CyberButton'

interface HandshakeStep {
  id: number
  label: string
  flag: string
  flagColor: string
  direction: 'right' | 'left'
  from: 'client' | 'server'
  to: 'client' | 'server'
  explanation: string
  detail: string
  tcpBits: string
}

const STEPS: HandshakeStep[] = [
  {
    id: 0,
    label: 'SYN',
    flag: 'SYN',
    flagColor: 'text-cyber-blue',
    direction: 'right',
    from: 'client',
    to: 'server',
    explanation: 'Client → Server: "I want to connect!"',
    detail:
      'The client sends a SYN (Synchronize) packet to the server. It includes a randomly-chosen Initial Sequence Number (ISN). This tells the server: "I want to start a conversation, and my first byte is numbered X."',
    tcpBits: 'SYN=1, ACK=0, Seq=X (random)',
  },
  {
    id: 1,
    label: 'SYN-ACK',
    flag: 'SYN+ACK',
    flagColor: 'text-cyber-neon',
    direction: 'left',
    from: 'server',
    to: 'client',
    explanation: 'Server → Client: "Got it! I\'m ready too!"',
    detail:
      'The server responds with a SYN-ACK packet. It acknowledges the client\'s sequence number (ACK = X+1) meaning "I received your byte X". It also sends its own Initial Sequence Number Y so the client can track server data.',
    tcpBits: 'SYN=1, ACK=1, Seq=Y (random), Ack=X+1',
  },
  {
    id: 2,
    label: 'ACK',
    flag: 'ACK',
    flagColor: 'text-emerald-400',
    direction: 'right',
    from: 'client',
    to: 'server',
    explanation: 'Client → Server: "Perfect, let\'s talk!"',
    detail:
      'The client sends a final ACK acknowledging the server\'s sequence number (ACK = Y+1). Both sides are now synchronised. The TCP connection is fully established — application data can now flow in both directions.',
    tcpBits: 'SYN=0, ACK=1, Seq=X+1, Ack=Y+1',
  },
]

export const TCPHandshakeViz: React.FC = () => {
  const [step, setStep] = useState(-1)         // -1 = not started
  const [isAnimating, setIsAnimating] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  const currentStep = step >= 0 ? STEPS[step] : null
  const isComplete = step === STEPS.length - 1

  const advance = () => {
    if (isAnimating) return
    if (step < STEPS.length - 1) {
      setIsAnimating(true)
      setStep((s) => s + 1)
      setTimeout(() => setIsAnimating(false), 800)
    }
  }

  const retreat = () => {
    if (isAnimating) return
    if (step > 0) setStep((s) => s - 1)
    else if (step === 0) setStep(-1)
  }

  const replay = () => {
    setStep(-1)
    setIsAnimating(false)
  }

  // Auto-play through steps
  useEffect(() => {
    if (!autoPlay) return
    if (step >= STEPS.length - 1) {
      setAutoPlay(false)
      return
    }
    const timer = setTimeout(() => advance(), step === -1 ? 400 : 1500)
    return () => clearTimeout(timer)
  })

  const startAutoPlay = () => {
    if (step >= STEPS.length - 1) replay()
    setAutoPlay(true)
  }

  return (
    <div className="space-y-5">
      {/* Diagram */}
      <GlassCard className="p-6 overflow-hidden">
        <div className="relative">
          {/* Client + Server nodes */}
          <div className="flex items-start justify-between gap-4">
            {/* Client */}
            <div className="flex flex-col items-center gap-2 w-28 flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-500 ${
                  currentStep?.from === 'client'
                    ? 'border-cyber-blue bg-cyber-blue/20 shadow-lg shadow-cyber-blue/30'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                💻
              </div>
              <span className="text-xs font-semibold text-white">Client</span>
              <span className="text-[10px] text-cyber-muted font-mono">192.168.1.10</span>
            </div>

            {/* Middle — animation lane */}
            <div className="flex-1 relative h-16 flex items-center">
              {/* Line */}
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />

              {/* Animated packet */}
              <AnimatePresence mode="wait">
                {currentStep && (
                  <motion.div
                    key={`packet-${step}`}
                    initial={{ x: currentStep.direction === 'right' ? '-20%' : '120%', opacity: 0 }}
                    animate={{ x: currentStep.direction === 'right' ? '120%' : '-20%', opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 flex justify-center"
                  >
                    <div
                      className={`px-3 py-1.5 rounded-full border text-xs font-bold font-mono shadow-lg ${
                        currentStep.id === 0
                          ? 'bg-cyber-blue/30 border-cyber-blue text-cyber-blue shadow-cyber-blue/30'
                          : currentStep.id === 1
                          ? 'bg-cyber-neon/20 border-cyber-neon text-cyber-neon shadow-cyber-neon/30'
                          : 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-400/30'
                      }`}
                    >
                      {currentStep.flag}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Server */}
            <div className="flex flex-col items-center gap-2 w-28 flex-shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-500 ${
                  currentStep?.from === 'server'
                    ? 'border-cyber-neon bg-cyber-neon/10 shadow-lg shadow-cyber-neon/20'
                    : 'border-white/20 bg-white/5'
                }`}
              >
                🖥️
              </div>
              <span className="text-xs font-semibold text-white">Server</span>
              <span className="text-[10px] text-cyber-muted font-mono">93.184.216.34</span>
            </div>
          </div>

          {/* Step progress dots */}
          <div className="flex items-center justify-center gap-3 mt-6">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { if (!isAnimating) setStep(i) }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono font-semibold border transition-all ${
                  i === step
                    ? i === 0
                      ? 'bg-cyber-blue/30 border-cyber-blue text-cyber-blue'
                      : i === 1
                      ? 'bg-cyber-neon/20 border-cyber-neon text-cyber-neon'
                      : 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                    : i < step
                    ? 'bg-white/10 border-white/20 text-white/60'
                    : 'bg-transparent border-white/10 text-cyber-muted hover:border-white/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${i <= step ? 'bg-current' : 'bg-current opacity-30'}`} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {/* Explanation panel */}
      <AnimatePresence mode="wait">
        {currentStep ? (
          <motion.div
            key={`explain-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold font-mono px-3 py-1 rounded-full border ${
                    step === 0
                      ? 'bg-cyber-blue/20 border-cyber-blue text-cyber-blue'
                      : step === 1
                      ? 'bg-cyber-neon/15 border-cyber-neon text-cyber-neon'
                      : 'bg-emerald-500/15 border-emerald-400 text-emerald-400'
                  }`}
                >
                  Step {step + 1} / {STEPS.length}: {currentStep.flag}
                </span>
                <span className="text-xs text-cyber-muted">{currentStep.explanation}</span>
              </div>

              <p className="text-xs text-cyber-text leading-relaxed">{currentStep.detail}</p>

              <div className="p-3 rounded-lg bg-black/50 border border-white/10 font-mono text-xs">
                <span className="text-cyber-muted text-[10px] block mb-1">TCP Packet Fields:</span>
                <span className="text-cyber-neon">{currentStep.tcpBits}</span>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard className="p-5">
              <p className="text-xs text-cyber-muted leading-relaxed text-center">
                The <strong className="text-white">TCP Three-Way Handshake</strong> is performed before any application data is sent.
                It synchronises sequence numbers between client and server so both sides can track packet ordering and delivery.
                Press <strong className="text-cyber-neon">Next</strong> or <strong className="text-cyber-neon">Auto-Play</strong> to begin.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <CyberButton
            variant="ghost"
            size="sm"
            onClick={retreat}
            disabled={step < 0}
            icon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Back
          </CyberButton>

          <CyberButton
            variant={isComplete ? 'outline' : 'blue'}
            size="sm"
            onClick={advance}
            disabled={isComplete || isAnimating}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            {step === -1 ? 'Start' : isComplete ? 'Complete ✓' : 'Next'}
          </CyberButton>
        </div>

        <div className="flex items-center gap-2">
          <CyberButton
            variant="neon"
            size="sm"
            onClick={startAutoPlay}
            disabled={autoPlay}
            icon={<Play className="w-3.5 h-3.5" />}
          >
            Auto-Play
          </CyberButton>
          <CyberButton
            variant="outline"
            size="sm"
            onClick={replay}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Replay
          </CyberButton>
        </div>
      </div>

      {/* Connection established banner */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/40 text-center"
          >
            <p className="text-sm font-semibold text-emerald-400">🎉 TCP Connection Established!</p>
            <p className="text-xs text-cyber-muted mt-1">
              Both sides are synchronised. Application data (HTTP, TLS, etc.) can now flow reliably.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
