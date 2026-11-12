/**
 * Packet Explainer Engine
 * Pure static logic — no API calls.
 * Generates beginner-friendly explanations for individual packets.
 */

import type { Packet } from '../types'

export interface PacketExplanation {
  headline: string
  whatIsThisPacket: string
  purpose: string
  whyImportant: string
  networkContext: string
  suspicionLevel: 'normal' | 'low' | 'medium' | 'high'
  suspicionReason?: string
  tcpFlagsMeaning?: string
  protocolNote: string
  analystHint: string
}

// Well-known port descriptions
const PORT_NAMES: Record<number, string> = {
  20: 'FTP Data',
  21: 'FTP Control',
  22: 'SSH',
  23: 'Telnet (insecure)',
  25: 'SMTP (Email)',
  53: 'DNS',
  67: 'DHCP Server',
  68: 'DHCP Client',
  80: 'HTTP',
  110: 'POP3 (Email)',
  143: 'IMAP (Email)',
  161: 'SNMP',
  443: 'HTTPS',
  445: 'SMB (File Sharing)',
  3306: 'MySQL',
  3389: 'RDP (Remote Desktop)',
  5432: 'PostgreSQL',
  6379: 'Redis',
  8080: 'HTTP Alternate',
  8443: 'HTTPS Alternate',
}

const getPortName = (port?: number): string | null => {
  if (!port) return null
  return PORT_NAMES[port] ?? null
}

function getTcpFlagMeaning(flags?: Packet['tcpFlags']): string | undefined {
  if (!flags) return undefined

  const active: string[] = []
  if (flags.syn && !flags.ack) active.push('SYN: initiating a new connection')
  if (flags.syn && flags.ack) active.push('SYN+ACK: server accepting the connection')
  if (flags.fin) active.push('FIN: requesting to close connection')
  if (flags.rst) active.push('RST: abruptly resetting / refusing connection')
  if (flags.psh) active.push('PSH: pushing buffered data to application immediately')
  if (flags.ack && !flags.syn) active.push('ACK: acknowledging received data')
  if (flags.urg) active.push('URG: urgent data present')

  return active.length > 0 ? active.join('; ') : undefined
}

function getSuspicion(pkt: Packet): { level: PacketExplanation['suspicionLevel']; reason?: string } {
  // Respect backend-flagged suspicion
  if (pkt.isSuspicious && pkt.suspiciousReason) {
    return { level: 'high', reason: pkt.suspiciousReason }
  }

  // Telnet (plaintext)
  if (pkt.destinationPort === 23 || pkt.sourcePort === 23) {
    return { level: 'medium', reason: 'Telnet transmits credentials in plaintext — a significant security risk on modern networks.' }
  }

  // RST barrage indicator
  if (pkt.tcpFlags?.rst && !pkt.tcpFlags?.syn) {
    return { level: 'low', reason: 'TCP RST can indicate a closed port, a firewall reject, or an injected reset attack.' }
  }

  // High TTL / unusual flags
  if (pkt.tcpFlags?.urg) {
    return { level: 'low', reason: 'URG flag is rarely used in normal traffic — may indicate covert data signalling.' }
  }

  // DNS to non-standard port
  if (pkt.protocol === 'DNS' && pkt.destinationPort && pkt.destinationPort !== 53) {
    return { level: 'medium', reason: 'DNS traffic on a non-standard port may indicate DNS tunneling for data exfiltration.' }
  }

  // SMB on network
  if (pkt.destinationPort === 445 || pkt.sourcePort === 445) {
    return { level: 'low', reason: 'SMB (port 445) is frequently exploited (EternalBlue, WannaCry). Verify this is authorized internal traffic.' }
  }

  return { level: 'normal' }
}

export function explainPacket(pkt: Packet): PacketExplanation {
  const srcPortName = getPortName(pkt.sourcePort)
  const dstPortName = getPortName(pkt.destinationPort)
  const suspicion = getSuspicion(pkt)
  const tcpFlagsMeaning = getTcpFlagMeaning(pkt.tcpFlags)

  const portLabel = dstPortName
    ? `port ${pkt.destinationPort} (${dstPortName})`
    : pkt.destinationPort
    ? `port ${pkt.destinationPort}`
    : 'an unknown port'

  // Protocol-specific explanations
  switch (pkt.protocol.toUpperCase()) {
    case 'TCP': {
      const flags = pkt.tcpFlags
      let headline = 'TCP Data Packet'
      let whatIsThisPacket = `This is a Transmission Control Protocol (TCP) packet carrying data between ${pkt.sourceIp} and ${pkt.destinationIp}.`
      let purpose = 'Transporting application data reliably over the network.'
      let networkContext = `TCP ensures this data arrives in order and without corruption.`

      if (flags?.syn && !flags?.ack) {
        headline = 'TCP Connection Request (SYN)'
        whatIsThisPacket = `${pkt.sourceIp} is initiating a new TCP connection to ${pkt.destinationIp} at ${portLabel}.`
        purpose = 'Starting the Three-Way Handshake — the first step to establish a reliable TCP session.'
        networkContext = `The SYN packet carries the initial sequence number. If the server accepts, it will reply with SYN+ACK. This is normal connection setup.`
      } else if (flags?.syn && flags?.ack) {
        headline = 'TCP Connection Accepted (SYN+ACK)'
        whatIsThisPacket = `${pkt.sourceIp} (server) is accepting the connection request from ${pkt.destinationIp}.`
        purpose = 'Second step of the Three-Way Handshake — server acknowledging the client\'s SYN.'
        networkContext = `The server responds with SYN+ACK, echoing the client's sequence number +1 as an acknowledgement and sending its own initial sequence number.`
      } else if (flags?.fin) {
        headline = 'TCP Connection Close (FIN)'
        whatIsThisPacket = `${pkt.sourceIp} is signalling it has finished sending data to ${pkt.destinationIp}.`
        purpose = 'Initiating graceful TCP connection termination.'
        networkContext = `FIN starts the Four-Way Handshake close sequence: FIN → ACK → FIN → ACK. The connection remains half-open until both sides send FIN.`
      } else if (flags?.rst) {
        headline = 'TCP Connection Reset (RST)'
        whatIsThisPacket = `${pkt.sourceIp} is forcibly terminating the TCP connection with ${pkt.destinationIp}.`
        purpose = 'Abrupt connection reset — usually indicates a closed port, firewall rejection, or injection attack.'
        networkContext = `RST immediately terminates the connection without the graceful FIN sequence. This can be a normal firewall response or a sign of TCP RST injection.`
      } else if (flags?.ack && !flags?.syn) {
        headline = 'TCP Acknowledgement (ACK)'
        whatIsThisPacket = `${pkt.sourceIp} is acknowledging receipt of data from ${pkt.destinationIp}.`
        purpose = 'Confirming that previously received data was successfully received.'
        networkContext = `ACK packets are the feedback mechanism of TCP's reliability guarantee. The absence of ACKs triggers retransmission.`
      }

      return {
        headline,
        whatIsThisPacket,
        purpose,
        whyImportant: 'TCP is the foundation of most internet applications. Understanding TCP flags is essential for analysing connection states and detecting attacks like SYN floods, RST injections, and port scans.',
        networkContext,
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        tcpFlagsMeaning,
        protocolNote: `TCP operates at Layer 4 (Transport). It provides ordered, reliable delivery using sequence numbers, acknowledgements, and flow control.`,
        analystHint: srcPortName
          ? `Source port ${pkt.sourcePort} (${srcPortName}) suggests the initiating service. ${dstPortName ? `Destination ${dstPortName} identifies the target service.` : ''}`
          : dstPortName
          ? `Destination port ${pkt.destinationPort} identifies the target service: ${dstPortName}.`
          : `Check if the port numbers correspond to any expected services in this environment.`,
      }
    }

    case 'UDP': {
      return {
        headline: 'UDP Datagram',
        whatIsThisPacket: `This is a User Datagram Protocol (UDP) packet from ${pkt.sourceIp} to ${pkt.destinationIp} at ${portLabel}.`,
        purpose: `Fast, connectionless data delivery — delivery is not guaranteed.`,
        whyImportant: 'UDP is essential for latency-sensitive applications like video, gaming, and DNS. Its simplicity means no handshake overhead.',
        networkContext: `UDP sends data without establishing a session. If this packet is lost, no retransmission occurs — the application must handle it.`,
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        protocolNote: `UDP operates at Layer 4 (Transport). It has only an 8-byte header with source/destination port, length, and checksum — no sequencing or acknowledgement.`,
        analystHint: dstPortName
          ? `Port ${pkt.destinationPort} (${dstPortName}) indicates this is likely ${dstPortName} traffic.`
          : `UDP to unknown port ${pkt.destinationPort} — verify this is an expected service.`,
      }
    }

    case 'DNS': {
      const queryInfo = pkt.dnsQuery ? `Querying: "${pkt.dnsQuery}"` : ''
      return {
        headline: 'DNS Query or Response',
        whatIsThisPacket: `This is a Domain Name System (DNS) packet from ${pkt.sourceIp} to ${pkt.destinationIp}. ${queryInfo}`,
        purpose: 'Resolving a domain name to an IP address (or the reverse), or returning the resolved answer.',
        whyImportant: 'DNS is the first step of nearly every internet connection. Attackers exploit DNS for data exfiltration (DNS tunneling) and redirection (DNS hijacking).',
        networkContext: pkt.dnsQuery
          ? `A DNS resolver is being asked for the IP address of "${pkt.dnsQuery}". The response will contain the IP or a "not found" error.`
          : 'A DNS exchange is in progress. DNS normally uses UDP on port 53.',
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        protocolNote: `DNS operates at Layer 7 (Application) over UDP port 53. It's hierarchical — Recursive Resolvers → Root Servers → TLD Servers → Authoritative Servers.`,
        analystHint: pkt.dnsQuery
          ? `Inspect "${pkt.dnsQuery}" — is this domain known? Check threat intelligence feeds for newly-registered or DGA-like domain names.`
          : 'Correlate DNS queries with subsequent TCP connections to the resolved IP address.',
      }
    }

    case 'HTTP': {
      const method = pkt.httpMethod ? `${pkt.httpMethod} request` : 'HTTP traffic'
      const uri = pkt.httpUri ? ` for "${pkt.httpUri}"` : ''
      return {
        headline: `HTTP ${pkt.httpMethod || 'Request/Response'}`,
        whatIsThisPacket: `This is an unencrypted HTTP ${method}${uri} between ${pkt.sourceIp} and ${pkt.destinationIp} on port ${pkt.destinationPort ?? pkt.sourcePort ?? 80}.`,
        purpose: pkt.httpMethod === 'POST'
          ? 'Submitting form data or API payload to the web server.'
          : pkt.httpMethod === 'GET'
          ? 'Requesting a web resource (page, image, file, or API endpoint).'
          : 'Web browser-to-server communication.',
        whyImportant: 'HTTP is plaintext — all content including passwords, session cookies, and file contents are visible to anyone on the network path.',
        networkContext: `HTTP uses TCP port 80. This traffic is NOT encrypted — unlike HTTPS (port 443). Anyone with network access can read this conversation.`,
        suspicionLevel: 'low',
        suspicionReason: 'HTTP (plaintext) is a security concern for sensitive data. Consider whether HTTPS should be enforced.',
        protocolNote: `HTTP is a Layer 7 Application protocol. The request includes method, URL, headers (Host, User-Agent, Cookie) and optionally a body (for POST).`,
        analystHint: pkt.httpUri
          ? `Inspect the URI "${pkt.httpUri}" for sensitive paths like /admin, /login, /api/keys, or parameter names containing "password", "token", or "secret".`
          : 'Extract the full HTTP headers and body from this packet to review credentials, cookies, or uploaded content.',
      }
    }

    case 'HTTPS':
    case 'TLS': {
      return {
        headline: 'TLS Encrypted Traffic (HTTPS)',
        whatIsThisPacket: `This is an encrypted TLS record between ${pkt.sourceIp} and ${pkt.destinationIp} on port ${pkt.destinationPort ?? pkt.sourcePort ?? 443}.`,
        purpose: 'Carrying encrypted HTTP content — web pages, API calls, credentials — protected from eavesdropping.',
        whyImportant: 'TLS is the security layer of the web. Even if intercepted, the content is unreadable without the private key. However, TLS metadata (SNI, certificate, timing) can still reveal the site being accessed.',
        networkContext: `The TLS handshake negotiated encryption keys. All subsequent "Application Data" records are encrypted. Wireshark can decrypt if you have the session keys (SSLKEYLOGFILE).`,
        suspicionLevel: 'normal',
        protocolNote: `TLS 1.3 is the current standard. TLS 1.0 and 1.1 are deprecated and insecure. The TLS handshake includes the server\'s SNI (Server Name Indication), exposing the target domain even before connection.`,
        analystHint: 'Even in encrypted HTTPS traffic, TLS handshake packets (ClientHello) contain the SNI field showing the destination domain — this is not encrypted and is visible in packet captures.',
      }
    }

    case 'ARP': {
      return {
        headline: 'ARP Request or Reply',
        whatIsThisPacket: `This is an Address Resolution Protocol (ARP) packet from ${pkt.sourceIp}. ARP broadcasts ask "Who has this IP? Tell me your MAC address."`,
        purpose: 'Discovering the hardware (MAC) address corresponding to a known IP address on the local network.',
        whyImportant: 'ARP has no authentication — any device can claim any IP. ARP spoofing lets attackers intercept all traffic between two hosts (Man-in-the-Middle attack).',
        networkContext: `ARP operates at Layer 2 (Data Link). It's broadcast-based — every device on the subnet receives ARP requests. The ARP cache on each device stores recent IP-to-MAC mappings.`,
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        protocolNote: `ARP replies that change existing ARP cache entries (Gratuitous ARP or unsolicited replies) are strong indicators of ARP spoofing.`,
        analystHint: 'Look for multiple ARP replies for the same IP address from different MAC addresses — this is the classic ARP spoofing signature.',
      }
    }

    case 'ICMP': {
      const isEchoReq = pkt.info.toLowerCase().includes('echo request') || pkt.info.toLowerCase().includes('ping')
      const isEchoRep = pkt.info.toLowerCase().includes('echo reply')
      return {
        headline: isEchoReq ? 'ICMP Echo Request (Ping)' : isEchoRep ? 'ICMP Echo Reply (Pong)' : 'ICMP Control Message',
        whatIsThisPacket: isEchoReq
          ? `${pkt.sourceIp} is pinging ${pkt.destinationIp} to test connectivity.`
          : isEchoRep
          ? `${pkt.sourceIp} is responding to a ping from ${pkt.destinationIp} — confirming it's reachable.`
          : `An ICMP control message from ${pkt.sourceIp} to ${pkt.destinationIp}: ${pkt.info}`,
        purpose: isEchoReq
          ? 'Testing whether a host is reachable and measuring round-trip latency.'
          : 'Responding to a ping, confirming the host is alive and measuring response time.',
        whyImportant: 'ICMP is the diagnostic heartbeat of the internet — but also a common tool for reconnaissance (ping sweeps) and covert data channels (ICMP tunneling).',
        networkContext: `ICMP operates at Layer 3 (Network), embedded directly in IP packets. It has no port numbers. traceroute uses ICMP Time Exceeded messages to map routing paths.`,
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        protocolNote: `Unusually large ICMP packets, high-frequency pings to many hosts, or ICMP with non-standard payloads may indicate ping sweeps, DoS, or ICMP tunneling.`,
        analystHint: 'High-volume ICMP requests to many targets = ping sweep (host discovery). Large ICMP payload sizes = possible ICMP tunneling for data exfiltration.',
      }
    }

    default: {
      return {
        headline: `${pkt.protocol} Packet`,
        whatIsThisPacket: `This is a ${pkt.protocol} protocol packet from ${pkt.sourceIp}${pkt.sourcePort ? `:${pkt.sourcePort}` : ''} to ${pkt.destinationIp}${pkt.destinationPort ? `:${pkt.destinationPort}` : ''}.`,
        purpose: `Carrying ${pkt.protocol} application data between the two endpoints.`,
        whyImportant: `Understanding this protocol requires knowing the specific application or service using it.`,
        networkContext: `${pkt.info}`,
        suspicionLevel: suspicion.level,
        suspicionReason: suspicion.reason,
        tcpFlagsMeaning,
        protocolNote: `${pkt.protocol} is a network protocol. Cross-reference with Wireshark's protocol dissector for detailed field breakdowns.`,
        analystHint: `Look up ${pkt.protocol} in IANA's protocol registry and cross-reference port numbers with expected services in this network environment.`,
      }
    }
  }
}
