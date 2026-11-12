/**
 * TrafficStory — Network Traffic Story Mode.
 * Converts packet sequences into narrative stories for beginners.
 * Works with both real captured data and built-in sample sequences.
 */

import { useState } from 'react'
import { BookOpen, ChevronRight, Info, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { GlassCard } from '../ui/GlassCard'
import { ProtocolBadge } from '../ui/Badge'
import type { Packet } from '../../types'

interface StoryEvent {
  title: string
  icon: string
  narrative: string
  packets: { id: number; protocol: string; src: string; dst: string; info: string }[]
  techDetail: string
}

// Sample story for when no real data is loaded
const SAMPLE_STORY: StoryEvent[] = [
  {
    title: 'DNS Resolution',
    icon: '📖',
    narrative:
      'A user types "example.com" into their browser. The computer first checks its local DNS cache — no match. It then sends a DNS query to the DNS resolver (8.8.8.8) asking: "What is the IP address for example.com?" After 12ms, the resolver responds with 93.184.216.34.',
    packets: [
      { id: 1, protocol: 'DNS', src: '192.168.1.10', dst: '8.8.8.8', info: 'Standard query A example.com' },
      { id: 2, protocol: 'DNS', src: '8.8.8.8', dst: '192.168.1.10', info: 'Standard query response A 93.184.216.34' },
    ],
    techDetail: 'DNS uses UDP port 53. The query takes typically 1–50ms. The TTL on the response determines how long the IP is cached.',
  },
  {
    title: 'TCP Three-Way Handshake',
    icon: '🤝',
    narrative:
      'The browser now knows the IP address (93.184.216.34). Before sending any HTTP data, it must establish a reliable TCP connection. The browser sends a SYN packet — the server responds with SYN+ACK — and the browser confirms with ACK. The connection is live in just 3 packets.',
    packets: [
      { id: 3, protocol: 'TCP', src: '192.168.1.10:54321', dst: '93.184.216.34:443', info: 'SYN Seq=0 Win=65535' },
      { id: 4, protocol: 'TCP', src: '93.184.216.34:443', dst: '192.168.1.10:54321', info: 'SYN, ACK Seq=0 Ack=1' },
      { id: 5, protocol: 'TCP', src: '192.168.1.10:54321', dst: '93.184.216.34:443', info: 'ACK Seq=1 Ack=1' },
    ],
    techDetail: 'TCP port 443 indicates HTTPS. The handshake synchronises Initial Sequence Numbers (ISNs) for both directions.',
  },
  {
    title: 'TLS Handshake',
    icon: '🔒',
    narrative:
      'With the TCP connection open, the browser and server now negotiate encryption. The browser sends a TLS ClientHello announcing which cipher suites it supports. The server responds with its certificate and chosen cipher. Keys are exchanged and all future communication is encrypted.',
    packets: [
      { id: 6, protocol: 'TLS', src: '192.168.1.10', dst: '93.184.216.34', info: 'TLSv1.3 Client Hello (SNI: example.com)' },
      { id: 7, protocol: 'TLS', src: '93.184.216.34', dst: '192.168.1.10', info: 'TLSv1.3 Server Hello, Certificate, Finished' },
      { id: 8, protocol: 'TLS', src: '192.168.1.10', dst: '93.184.216.34', info: 'TLSv1.3 Finished' },
    ],
    techDetail: 'TLS 1.3 reduces the handshake to 1 round-trip. The SNI field in ClientHello reveals the target domain even in encrypted traffic.',
  },
  {
    title: 'HTTP Request & Response',
    icon: '🌐',
    narrative:
      'Inside the encrypted TLS tunnel, the browser sends an HTTPS GET request for the homepage. The server processes the request and returns a 200 OK response with the HTML content. From the user\'s perspective, the page starts loading.',
    packets: [
      { id: 9, protocol: 'HTTPS', src: '192.168.1.10', dst: '93.184.216.34', info: 'GET / HTTP/1.1 Host: example.com' },
      { id: 10, protocol: 'HTTPS', src: '93.184.216.34', dst: '192.168.1.10', info: 'HTTP/1.1 200 OK Content-Type: text/html' },
    ],
    techDetail: 'The actual HTTP content is encrypted (shown as "Application Data" in Wireshark). Only the metadata like packet size and timing is visible.',
  },
  {
    title: 'Connection Close',
    icon: '👋',
    narrative:
      'After the browser has received the page, the TCP connection is gracefully closed. The server sends a FIN packet signalling it\'s done sending. The browser acknowledges and sends its own FIN. Both sides have cleanly disconnected.',
    packets: [
      { id: 11, protocol: 'TCP', src: '93.184.216.34', dst: '192.168.1.10', info: 'FIN, ACK Seq=1 Ack=1' },
      { id: 12, protocol: 'TCP', src: '192.168.1.10', dst: '93.184.216.34', info: 'ACK Seq=1 Ack=2' },
      { id: 13, protocol: 'TCP', src: '192.168.1.10', dst: '93.184.216.34', info: 'FIN, ACK Seq=1 Ack=2' },
    ],
    techDetail: 'TCP\'s graceful close uses a Four-Way Handshake (FIN → ACK → FIN → ACK). Both sides must FIN independently.',
  },
]

function buildStoryFromPackets(packets: Packet[]): StoryEvent[] {
  if (packets.length === 0) return SAMPLE_STORY

  const events: StoryEvent[] = []

  // DNS events
  const dnsPackets = packets.filter((p) => p.protocol === 'DNS').slice(0, 4)
  if (dnsPackets.length > 0) {
    const queries = dnsPackets.filter((p) => p.info.toLowerCase().includes('query') || p.dnsQuery)
    const queryName = queries[0]?.dnsQuery || queries[0]?.info || 'a domain'
    events.push({
      title: 'DNS Resolution',
      icon: '📖',
      narrative: `The capture begins with DNS activity. ${queries.length > 0 ? `The host at ${queries[0].sourceIp} queried for "${queryName}".` : 'DNS lookups are resolving domain names to IP addresses.'} This is typically the first step before any connection — the computer needs to know which IP address to connect to.`,
      packets: dnsPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info })),
      techDetail: 'DNS uses UDP port 53 for most queries. Each DNS query/response is a small exchange that maps a domain name to one or more IP addresses.',
    })
  }

  // TCP Handshake events
  const synPackets = packets.filter((p) => p.tcpFlags?.syn && !p.tcpFlags?.ack).slice(0, 2)
  if (synPackets.length > 0) {
    const synAckPackets = packets.filter((p) => p.tcpFlags?.syn && p.tcpFlags?.ack).slice(0, 2)
    const synAcks = synAckPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info }))
    events.push({
      title: 'TCP Connection Setup',
      icon: '🤝',
      narrative: `TCP connections are being established. ${synPackets[0].sourceIp} initiated a connection to ${synPackets[0].destinationIp}${synPackets[0].destinationPort ? ` on port ${synPackets[0].destinationPort}` : ''}. The Three-Way Handshake ensures both sides agree on sequence numbers before any application data flows.`,
      packets: [
        ...synPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info })),
        ...synAcks.slice(0, 1),
      ],
      techDetail: `TCP SYN packets found in this capture. Each SYN represents a new connection attempt. Port ${synPackets[0].destinationPort ?? '?'} ${synPackets[0].destinationPort === 443 ? '(HTTPS) suggests encrypted web traffic' : synPackets[0].destinationPort === 80 ? '(HTTP) suggests unencrypted web traffic' : 'identifies the target service'}.`,
    })
  }

  // TLS/HTTPS
  const tlsPackets = packets.filter((p) => p.protocol === 'TLS' || p.protocol === 'HTTPS').slice(0, 4)
  if (tlsPackets.length > 0) {
    events.push({
      title: 'Encrypted Web Traffic',
      icon: '🔒',
      narrative: `Encrypted TLS/HTTPS traffic was detected. ${tlsPackets[0].sourceIp} is communicating securely with ${tlsPackets[0].destinationIp}. The content of this communication is not visible in the packet capture — only the TLS handshake metadata (like the target domain in the SNI field) is accessible.`,
      packets: tlsPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info })),
      techDetail: 'TLS Application Data records appear as opaque binary blobs in Wireshark. To decrypt, you need the session\'s private key or a pre-master secret log (SSLKEYLOGFILE).',
    })
  }

  // HTTP (plaintext)
  const httpPackets = packets.filter((p) => p.protocol === 'HTTP').slice(0, 4)
  if (httpPackets.length > 0) {
    events.push({
      title: 'Unencrypted HTTP Traffic',
      icon: '⚠️',
      narrative: `Plaintext HTTP traffic detected — this communication is NOT encrypted. ${httpPackets[0].sourceIp} is communicating with ${httpPackets[0].destinationIp} over HTTP (port 80). All data including any credentials, cookies, or file content is readable in this capture.`,
      packets: httpPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info })),
      techDetail: 'HTTP on port 80 sends all data in plaintext. This is a security concern if sensitive data is transmitted.',
    })
  }

  // ARP
  const arpPackets = packets.filter((p) => p.protocol === 'ARP').slice(0, 3)
  if (arpPackets.length > 0) {
    events.push({
      title: 'Local Network Discovery (ARP)',
      icon: '📡',
      narrative: `ARP (Address Resolution Protocol) activity detected. Devices on the local network are discovering each other's hardware (MAC) addresses. ${arpPackets[0].sourceIp} is looking up the MAC address for a device on its subnet — normal background activity on any local network.`,
      packets: arpPackets.map((p) => ({ id: p.id, protocol: p.protocol, src: p.sourceIp, dst: p.destinationIp, info: p.info })),
      techDetail: 'ARP operates at Layer 2 and is broadcast-based. All devices on the subnet receive ARP requests. Multiple conflicting ARP replies for one IP indicate potential ARP spoofing.',
    })
  }

  return events.length > 0 ? events : SAMPLE_STORY
}

interface TrafficStoryProps {
  packets?: Packet[]
  isRealData?: boolean
}

export const TrafficStory: React.FC<TrafficStoryProps> = ({ packets = [], isRealData = false }) => {
  const [selectedEvent, setSelectedEvent] = useState(0)
  const story = isRealData ? buildStoryFromPackets(packets) : SAMPLE_STORY
  const event = story[selectedEvent]

  return (
    <div className="space-y-5">
      {/* Data source notice */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-cyber-blue/10 border border-cyber-blue/30">
        {isRealData ? (
          <>
            <Radio className="w-3.5 h-3.5 text-cyber-neon flex-shrink-0" />
            <span className="text-xs text-cyber-muted">
              <strong className="text-cyber-neon">Story generated from your capture.</strong> Analysing {packets.length} real packets.
            </span>
          </>
        ) : (
          <>
            <Info className="w-3.5 h-3.5 text-cyber-blue flex-shrink-0" />
            <span className="text-xs text-cyber-muted">
              <strong className="text-cyber-blue">Sample story</strong> — Upload a real capture to generate a story from your traffic.
            </span>
          </>
        )}
      </div>

      {/* Story navigation */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {story.map((ev, i) => (
          <button
            key={i}
            onClick={() => setSelectedEvent(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selectedEvent === i
                ? 'bg-cyber-blue/20 border-cyber-blue text-white'
                : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20 hover:text-cyber-text'
            }`}
          >
            <span>{ev.icon}</span>
            <span className="whitespace-nowrap">{ev.title}</span>
          </button>
        ))}
      </div>

      {/* Story content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedEvent}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* Narrative */}
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{event.icon}</span>
              <div>
                <h3 className="text-sm font-bold text-white">{event.title}</h3>
                <span className="text-[10px] font-mono text-cyber-muted">
                  Stage {selectedEvent + 1} of {story.length}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-cyber-neon flex-shrink-0 mt-0.5" />
              <p className="text-sm text-cyber-text leading-relaxed">{event.narrative}</p>
            </div>
          </GlassCard>

          {/* Packets */}
          <div>
            <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-cyber-neon" />
              Related Packets
            </h4>
            <div className="space-y-1.5">
              {event.packets.map((pkt, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-black/40 border border-white/10 font-mono text-xs"
                >
                  <span className="text-cyber-muted w-8 text-right flex-shrink-0">#{pkt.id}</span>
                  <ProtocolBadge protocol={pkt.protocol} />
                  <span className="text-cyber-text truncate flex-1">{pkt.src}</span>
                  <span className="text-cyber-muted">→</span>
                  <span className="text-cyber-text truncate flex-1">{pkt.dst}</span>
                  <span className="text-cyber-muted truncate max-w-[200px] hidden md:block">{pkt.info}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tech detail */}
          <GlassCard className="p-4">
            <h4 className="text-xs font-semibold text-cyber-blue mb-2">🔬 Technical Detail</h4>
            <p className="text-xs text-cyber-muted leading-relaxed">{event.techDetail}</p>
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
