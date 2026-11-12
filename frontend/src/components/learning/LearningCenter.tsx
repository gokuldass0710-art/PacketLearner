/**
 * LearningCenter — Full Phase 4 learning view.
 * Tab-based: Protocol Center / TCP Handshake / Traffic Story / Quiz
 */

import { useState } from 'react'
import {
  BookOpen,
  Layers,
  GitMerge,
  BookMarked,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import { ProtocolCard } from './ProtocolCard'
import { TCPHandshakeViz } from './TCPHandshakeViz'
import { TrafficStory } from './TrafficStory'
import { QuizSection } from './QuizSection'
import { PROTOCOL_DATA } from '../../data/protocols'
import { QUIZ_DATA } from '../../data/quizzes'
import type { Packet } from '../../types'

type LearningTab = 'protocols' | 'handshake' | 'story' | 'quiz'

interface LearningCenterProps {
  packets?: Packet[]
  isRealData?: boolean
}

const TABS: { id: LearningTab; label: string; icon: React.ReactNode; description: string }[] = [
  {
    id: 'protocols',
    label: 'Protocol Center',
    icon: <BookOpen className="w-4 h-4" />,
    description: 'Learn TCP, UDP, DNS, HTTP, HTTPS, ARP, ICMP with examples and security relevance',
  },
  {
    id: 'handshake',
    label: 'TCP Handshake',
    icon: <GitMerge className="w-4 h-4" />,
    description: 'Interactive animated walkthrough of the TCP Three-Way Handshake',
  },
  {
    id: 'story',
    label: 'Traffic Story',
    icon: <BookMarked className="w-4 h-4" />,
    description: 'Understand network traffic as a step-by-step narrative story',
  },
  {
    id: 'quiz',
    label: 'Knowledge Quiz',
    icon: <HelpCircle className="w-4 h-4" />,
    description: 'Test your understanding of protocols with interactive quizzes',
  },
]

export const LearningCenter: React.FC<LearningCenterProps> = ({
  packets = [],
  isRealData = false,
}) => {
  const [activeTab, setActiveTab] = useState<LearningTab>('protocols')
  const [quizProtocol, setQuizProtocol] = useState<string>('tcp')
  const [openProtocol, setOpenProtocol] = useState<string | null>('tcp')
  const [quizScores, setQuizScores] = useState<Record<string, { score: number; total: number }>>({})

  const handleProtocolQuiz = (protocolId: string) => {
    setQuizProtocol(protocolId)
    setActiveTab('quiz')
  }

  const handleQuizFinish = (score: number, total: number) => {
    setQuizScores((prev) => ({ ...prev, [quizProtocol]: { score, total } }))
  }

  const currentQuiz = QUIZ_DATA.find((q) => q.protocolId === quizProtocol) ?? QUIZ_DATA[0]

  return (
    <div className="space-y-5">
      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-cyber-blue/15 border-cyber-blue/60 shadow-md shadow-cyber-blue/10'
                : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/8'
            }`}
          >
            <div
              className={`${activeTab === tab.id ? 'text-cyber-neon' : 'text-cyber-muted'} transition-colors`}
            >
              {tab.icon}
            </div>
            <span
              className={`text-xs font-semibold leading-tight ${
                activeTab === tab.id ? 'text-white' : 'text-cyber-text'
              }`}
            >
              {tab.label}
            </span>
            <span className="text-[10px] text-cyber-muted leading-tight hidden sm:block">{tab.description}</span>
          </button>
        ))}
      </div>

      {/* Protocol Center */}
      {activeTab === 'protocols' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-1">
            <Layers className="w-4 h-4 text-cyber-blue" />
            <h2 className="text-sm font-bold text-white">Protocol Learning Center</h2>
            <span className="text-[10px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-white/5 border border-white/10">
              {PROTOCOL_DATA.length} protocols
            </span>
          </div>

          {/* Protocol progress summary */}
          {Object.keys(quizScores).length > 0 && (
            <GlassCard className="p-4">
              <h4 className="text-xs font-semibold text-white mb-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-cyber-neon" />
                Your Quiz Progress
              </h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(quizScores).map(([proto, { score, total }]) => {
                  const pct = Math.round((score / total) * 100)
                  return (
                    <div
                      key={proto}
                      className={`text-xs font-mono px-2.5 py-1 rounded border ${
                        pct >= 80
                          ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-400'
                          : pct >= 60
                          ? 'bg-cyber-blue/15 border-cyber-blue/40 text-cyber-blue'
                          : 'bg-amber-500/15 border-amber-400/40 text-amber-400'
                      }`}
                    >
                      {proto.toUpperCase()}: {score}/{total}
                    </div>
                  )
                })}
              </div>
            </GlassCard>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {PROTOCOL_DATA.map((protocol) => (
              <div key={protocol.id} onClick={() => setOpenProtocol(openProtocol === protocol.id ? null : protocol.id)}>
                <ProtocolCard
                  protocol={protocol}
                  defaultOpen={openProtocol === protocol.id}
                  onSelectForQuiz={handleProtocolQuiz}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TCP Handshake */}
      {activeTab === 'handshake' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-1">
            <GitMerge className="w-4 h-4 text-cyber-blue" />
            <h2 className="text-sm font-bold text-white">TCP Three-Way Handshake</h2>
            <span className="text-[10px] font-mono text-cyber-muted px-2 py-0.5 rounded bg-white/5 border border-white/10">
              Interactive Animation
            </span>
          </div>

          <GlassCard className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ChevronDown className="w-3.5 h-3.5 text-cyber-neon" />
              <span className="text-xs font-semibold text-white">What You'll Learn</span>
            </div>
            <ul className="text-xs text-cyber-muted space-y-1 list-disc list-inside ml-4">
              <li>Why TCP requires 3 packets before data can flow</li>
              <li>What SYN, SYN-ACK, and ACK flags mean</li>
              <li>How sequence numbers synchronise both sides</li>
              <li>What happens in a SYN flood attack (exhausting this process)</li>
            </ul>
          </GlassCard>

          <TCPHandshakeViz />
        </div>
      )}

      {/* Traffic Story */}
      {activeTab === 'story' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-1">
            <BookMarked className="w-4 h-4 text-cyber-blue" />
            <h2 className="text-sm font-bold text-white">Network Traffic Story Mode</h2>
          </div>
          <TrafficStory packets={packets} isRealData={isRealData} />
        </div>
      )}

      {/* Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 pb-1">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-cyber-blue" />
              <h2 className="text-sm font-bold text-white">Protocol Knowledge Quiz</h2>
            </div>
          </div>

          {/* Protocol selector */}
          <div className="flex flex-wrap gap-2">
            {QUIZ_DATA.map((q) => {
              const score = quizScores[q.protocolId]
              return (
                <button
                  key={q.protocolId}
                  onClick={() => setQuizProtocol(q.protocolId)}
                  className={`text-xs font-mono px-3 py-1.5 rounded-lg border transition-all ${
                    quizProtocol === q.protocolId
                      ? 'bg-cyber-blue text-white border-cyber-blue shadow-md shadow-cyber-blue/30'
                      : 'bg-white/5 text-cyber-muted border-white/15 hover:border-white/30'
                  }`}
                >
                  {q.protocolName}
                  {score && (
                    <span className={`ml-1.5 font-mono ${
                      Math.round((score.score / score.total) * 100) >= 80
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {score.score}/{score.total}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {currentQuiz && (
            <QuizSection
              key={quizProtocol}
              quiz={currentQuiz}
              onFinish={handleQuizFinish}
            />
          )}
        </div>
      )}
    </div>
  )
}
