import React from 'react'
import { GlassCard } from '../ui/GlassCard'
import { GraduationCap, ArrowRight, BookOpen, Sparkles } from 'lucide-react'

export interface LearningTopic {
  id: string
  title: string
  category: 'Protocols' | 'Threats' | 'Fundamentals'
  description: string
  duration: string
  difficulty: 'Beginner' | 'Intermediate'
  protocol: 'TCP' | 'DNS' | 'TLS' | 'ARP'
}

const learningTopics: LearningTopic[] = [
  {
    id: 'learn-01',
    title: 'TCP 3-Way Handshake Demystified',
    category: 'Protocols',
    description:
      'Learn how clients and servers establish reliable connections using SYN, SYN-ACK, and ACK flags.',
    duration: '6 min read',
    difficulty: 'Beginner',
    protocol: 'TCP',
  },
  {
    id: 'learn-02',
    title: 'Decoding DNS Lookups & Latency',
    category: 'Fundamentals',
    description:
      'Understand how domain name resolution works over UDP/53, query types (A, AAAA, MX), and common errors.',
    duration: '5 min read',
    difficulty: 'Beginner',
    protocol: 'DNS',
  },
  {
    id: 'learn-03',
    title: 'Spotting Port Scans from Packet Flags',
    category: 'Threats',
    description:
      'Identify reconnaissance patterns: rapid SYN requests across sequential ports followed by RST responses.',
    duration: '8 min read',
    difficulty: 'Beginner',
    protocol: 'TCP',
  },
]

interface LearningCardProps {
  onSelectTopic?: (topicId: string) => void
}

export const LearningCard: React.FC<LearningCardProps> = ({ onSelectTopic }) => {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyber-neon" />
          <div>
            <h3 className="text-sm font-semibold text-white">Cybersecurity Learning Center</h3>
            <p className="text-[11px] text-cyber-muted">Beginner-friendly networking guides</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-neon/10 text-cyber-neon border border-cyber-neon/30 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Interactive
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {learningTopics.map((topic) => (
          <div
            key={topic.id}
            onClick={() => onSelectTopic?.(topic.id)}
            className="p-4 rounded-lg bg-cyber-bg border border-white/10 hover:border-cyber-neon/40 hover:bg-white/[0.03] transition-colors duration-200 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30 font-semibold">
                  {topic.protocol}
                </span>
                <span className="text-[10px] font-mono text-cyber-muted">
                  {topic.duration}
                </span>
              </div>

              <h4 className="text-xs font-semibold text-white group-hover:text-cyber-neon transition-colors leading-snug">
                {topic.title}
              </h4>

              <p className="mt-1.5 text-[11px] text-cyber-muted line-clamp-3 leading-relaxed">
                {topic.description}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
              <span className="text-[10px] font-mono text-white/70">
                {topic.difficulty}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-cyber-neon font-medium group-hover:translate-x-0.5 transition-transform">
                Read Guide
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-cyber-muted">
        <span className="flex items-center gap-1 text-[11px]">
          <BookOpen className="w-3.5 h-3.5 text-cyber-blue" />
          Covers OSI Layer 2 to Layer 7 concepts
        </span>
        <span className="text-[10px] font-mono text-cyber-neon">3 Guides Ready</span>
      </div>
    </GlassCard>
  )
}
