/**
 * ProtocolCard — Interactive expandable card for a single protocol.
 * Shows definition, how-it-works steps, examples, and security relevance.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Shield, AlertTriangle, Lightbulb, Zap, BookOpen } from 'lucide-react'
import { GlassCard } from '../ui/GlassCard'
import type { ProtocolData } from '../../data/protocols'

interface ProtocolCardProps {
  protocol: ProtocolData
  defaultOpen?: boolean
  onSelectForQuiz?: (protocolId: string) => void
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({ protocol, defaultOpen = false, onSelectForQuiz }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [activeTab, setActiveTab] = useState<'learn' | 'examples' | 'security'>('learn')

  return (
    <GlassCard
      variant={isOpen ? 'accent-blue' : 'interactive'}
      className="overflow-hidden transition-all duration-300"
    >
      {/* Header */}
      <button
        className="w-full text-left p-4 flex items-center justify-between gap-4 group"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl ${protocol.bgColor} border ${protocol.borderColor}`}
          >
            {protocol.headerIcon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-bold text-sm font-mono ${protocol.color}`}>{protocol.name}</span>
              <span className="text-[10px] text-cyber-muted font-mono px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                Layer {protocol.layerNumber} · {protocol.layer}
              </span>
              {protocol.ports && (
                <span className="text-[10px] text-cyber-muted font-mono px-1.5 py-0.5 rounded bg-black/40 border border-white/10 hidden sm:inline">
                  {protocol.ports}
                </span>
              )}
            </div>
            <p className="text-xs text-cyber-muted mt-0.5 line-clamp-1">{protocol.tagline}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-cyber-muted group-hover:text-cyber-neon transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expandable body */}
      {isOpen && (
        <div className="border-t border-white/10 animate-in fade-in duration-200">
          {/* Tab switcher */}
          <div className="flex border-b border-white/5 bg-black/20">
            {(['learn', 'examples', 'security'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'text-cyber-neon border-b-2 border-cyber-neon bg-cyber-neon/5'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {tab === 'learn' ? '📚 Learn' : tab === 'examples' ? '💡 Examples' : '🔒 Security'}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-4">
            {activeTab === 'learn' && (
              <>
                {/* Definition */}
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-cyber-blue" />
                    What is {protocol.name}?
                  </h4>
                  <p className="text-xs text-cyber-muted leading-relaxed">{protocol.definition}</p>
                </div>

                {/* How it works */}
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
                    <Zap className="w-3.5 h-3.5 text-cyber-neon" />
                    How it works
                  </h4>
                  <ol className="space-y-1.5">
                    {protocol.howItWorks.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-cyber-muted">
                        <span
                          className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${protocol.bgColor} ${protocol.color} border ${protocol.borderColor}`}
                        >
                          {i + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Key fact */}
                <div className="p-3 rounded-lg bg-black/40 border border-cyber-neon/20">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-cyber-neon flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-cyber-text leading-relaxed">
                      <span className="font-semibold text-cyber-neon">Key Fact: </span>
                      {protocol.keyFact}
                    </p>
                  </div>
                </div>

                {/* Beginner tip */}
                <div className="p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
                  <p className="text-xs text-cyber-text leading-relaxed">
                    <span className="font-semibold text-cyber-blue">Beginner Tip: </span>
                    {protocol.beginnerTip}
                  </p>
                </div>
              </>
            )}

            {activeTab === 'examples' && (
              <div className="space-y-3">
                {protocol.realWorldExamples.map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${protocol.color}`}>{ex.scenario}</span>
                    </div>
                    <p className="text-xs text-cyber-muted leading-relaxed">{ex.description}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'security' && (
              <>
                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                    Security Relevance
                  </h4>
                  <p className="text-xs text-cyber-muted leading-relaxed">{protocol.securityRelevance}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Common Attacks
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {protocol.commonAttacks.map((attack, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30"
                      >
                        {attack}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Quiz CTA */}
            {onSelectForQuiz && (
              <div className="pt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => onSelectForQuiz(protocol.id)}
                  className="text-xs text-cyber-neon hover:text-white font-mono flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyber-neon/10 border border-cyber-neon/30 hover:bg-cyber-neon/20 transition-all"
                >
                  Test your knowledge →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  )
}
