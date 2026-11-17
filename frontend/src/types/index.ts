/**
 * Core type definitions for PacketLearner
 * Matches Wireshark / TShark decoded metadata structures
 */

export type ProtocolType =
  | 'TCP'
  | 'UDP'
  | 'DNS'
  | 'HTTP'
  | 'HTTPS'
  | 'TLS'
  | 'ICMP'
  | 'ARP'
  | 'DHCP'
  | 'OTHER'
  | string

export interface TCPFlags {
  syn: boolean
  ack: boolean
  fin: boolean
  rst: boolean
  psh: boolean
  urg: boolean
  raw?: string
}

export interface FrameLayer {
  frameNumber: number
  frameLength: number
  captureLength: number
  epochTime: number
  relativeTime: string
}

export interface EthernetLayer {
  sourceMac: string
  destinationMac: string
  type: string
}

export interface IPLayer {
  version: 4 | 6
  sourceIp: string
  destinationIp: string
  headerLength: number
  ttl: number
  protocolNumber: number
  checksum: string
  identification?: string
}

export interface TransportLayer {
  type: 'TCP' | 'UDP' | 'ICMP'
  sourcePort?: number
  destinationPort?: number
  seqNumber?: number
  ackNumber?: number
  tcpFlags?: TCPFlags
  windowSize?: number
  checksum: string
  length?: number
}

export interface ApplicationLayer {
  protocol: ProtocolType
  dns?: {
    transactionId: string
    queryName: string
    queryType: string
    isResponse: boolean
    responseCode?: string
    answers?: string[]
  }
  http?: {
    method?: string
    uri?: string
    host?: string
    statusCode?: number
    statusMessage?: string
    userAgent?: string
    contentType?: string
  }
  tls?: {
    version: string
    handshakeType: string
    cipherSuite?: string
    serverName?: string
  }
}

export interface BeginnerExplanation {
  headline: string
  whatHappened: string
  whyItMatters: string
  securityInsight: string
  protocolContext: string
}

export interface Packet {
  id: number
  timestamp: number // relative seconds
  formattedTime: string
  sourceIp: string
  destinationIp: string
  sourcePort?: number
  destinationPort?: number
  protocol: ProtocolType
  length: number // bytes
  info: string
  tcpFlags?: TCPFlags
  dnsQuery?: string
  httpMethod?: string
  httpUri?: string
  isSuspicious?: boolean
  suspiciousReason?: string
  layers?: {
    frame: FrameLayer
    ethernet: EthernetLayer
    ip: IPLayer
    transport?: TransportLayer
    application?: ApplicationLayer
  }
  explanation?: BeginnerExplanation
  rawHex?: string
}

export interface BackendCaptureMetadata {
  fileName: string
  fileSizeBytes: number
  format: string
  totalPackets: number
  returnedPackets: number
  startTime?: string | null
  endTime?: string | null
  durationSeconds: number
}

export interface ProtocolCountItem {
  protocol: string
  count: number
  percentage: number
}

export interface TopTalkerItem {
  ip: string
  packetCount: number
  bytes: number
}

export interface AnalysisResponse {
  metadata: BackendCaptureMetadata
  protocolCounts: ProtocolCountItem[]
  topTalkers: TopTalkerItem[]
  packets: Packet[]
  findings: DetectionFinding[]
}

export interface FindingTimeWindow {
  startSeconds: number
  endSeconds: number
  durationSeconds: number
}

export interface DetectionFinding {
  id: string
  ruleId: string
  ruleName: string
  title: string
  severity: SeverityLevel
  sourceIp: string
  destinationIp: string
  observedDestinationPorts: number[]
  timeWindow: FindingTimeWindow
  packetCount: number
  relevantPacketIds: number[]
  explanation: string
  recommendedSteps: string[]
}

export interface AssistantPacketContext {
  id: number
  timestamp: number
  sourceIp: string
  destinationIp: string
  sourcePort?: number
  destinationPort?: number
  protocol: string
  length: number
  tcpFlags?: TCPFlags
}

export interface AssistantConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AssistantQuestionRequest {
  question: string
  provider?: AssistantProvider
  context: {
    fileName: string
    format: string
    totalPackets: number
    returnedPackets: number
    durationSeconds: number
    protocols: ProtocolCountItem[]
    selectedPacket?: AssistantPacketContext
    findings: DetectionFinding[]
  }
  conversation: AssistantConversationMessage[]
}

export type AssistantProvider = 'openai' | 'ollama'

export interface AssistantConfig {
  provider: AssistantProvider
  model: string
  ollama_model: string
  ollama_base_url: string
}

export interface AssistantResponse {
  answer: string
}

export interface BackendHealth {
  status: string
  tshark_installed: boolean
  tshark_path: string
  tshark_version?: string | null
}

export interface CaptureInterface {
  id: string
  name: string
  description: string
}

export interface CaptureStatus {
  status: 'idle' | 'running' | 'ready' | 'error'
  interface_id?: string | null
  started_at?: string | null
  elapsed_seconds: number
  duration_limit_seconds: number
  max_size_mb: number
  error?: string | null
}

export interface CaptureMetadata {
  id: string
  fileName: string
  fileSizeBytes: number
  format: 'pcap' | 'pcapng'
  totalPackets: number
  startTime?: string
  endTime?: string
  durationSeconds?: number
  protocolsPresent: { protocol: ProtocolType; count: number; percentage: number }[]
  topTalkers: { ip: string; packetCount: number; bytes: number }[]
}

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical'

export interface SuspiciousFinding {
  id: string
  ruleId: string
  ruleName: string
  severity: SeverityLevel
  title: string
  description: string
  sourceIp?: string
  destinationIp?: string
  relevantPacketIds: number[]
  detectionTimestamp: string
  evidence: string[]
  recommendedSteps: string[]
}

export type AppView = 'dashboard' | 'explorer' | 'beginner' | 'investigation'

export interface UserSession {
  isAuthenticated: boolean
  user?: {
    id: string
    email: string
    username: string
  }
}
